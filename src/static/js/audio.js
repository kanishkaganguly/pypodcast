////////////////////////////////////////////////////////////////
// Audio Variables
var has_permission = false;
var audio_sources = {};
////////////////////////////////////////////////////////////////
// Audio Functions

function setAudioSourceOnPlay() {
    // Show error if no audio access
    if (!has_permission) {
        $("#error-message").text("Please allow audio access");
        $("#error-modal").addClass("is-active");

        console.error("Please allow audio access");
        return;
    }

    // Set audio source
    if (is_player_ready) {
        const audioElement = player._sounds[0]._node;
        if (typeof audioElement.setSinkId === "function") {
            audioElement
                .setSinkId(curr_audio_source)
                .then(() => {
                    console.log("Audio source set to " + audio_sources[curr_audio_source]);
                    return;
                })
                .catch(err => {
                    console.error("Failed to set audio source: " + err);
                    $("#error-message").text("Failed to set audio source: " + err);
                    $("#error-modal").addClass("is-active");
                });
        }
    }
}

function audioPlayed() {
    // Update progress bar
    updateProgressDisplay();

    // Set play/pause button
    $("#play-pause").find("[data-fa-i2svg]").removeClass("fa-play").addClass("fa-pause");
    $("#play-pause").removeClass("paused");

    // Set audio source
    setAudioSourceOnPlay();

    console.log("HOWLER: Audio played");
}

function audioPaused() {
    // Stop progress bar
    stopProgressChecker();

    // Set play/pause button
    console.log($("#play-pause").find("[data-fa-i2svg]"));
    $("#play-pause").find("[data-fa-i2svg]").removeClass("fa-pause").addClass("fa-play");
    $("#play-pause").addClass("paused");

    console.log("HOWLER: Audio paused");

}

function audioStopped() {
    // Stop progress bar
    stopProgressChecker();

    // Set play/pause button
    $("#play-pause").find("[data-fa-i2svg]").removeClass("fa-pause").addClass("fa-play");
    $("#play-pause").addClass("paused");
}

function createAudioPlayerFromNowPlaying(now_playing_podname, episode_number) {
    $.ajax({
        url: "/get_episode_url/" + now_playing_podname.toLowerCase().replaceAll(" ", "_") + "/" + episode_number,
        type: "GET",
        success: function (data) {
            console.log("Get Episode URL: " + data);
            _createAudioPlayer(data);
        }
    });
}

function audioSourceSelector() {
    const constraints = {
        audio: true,
        video: false
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream =>
            navigator.mediaDevices
                .enumerateDevices()
                .then(devices => {
                    return devices
                })
                .catch(err => { throw err })
        )
        .then(devices => {
            has_permission = true;
            curr_audio_source = null;
            for (const mediaDeviceInfo of devices) {
                const { deviceId, kind, label } = mediaDeviceInfo;
                if (kind == "audiooutput") {
                    console.log(deviceId, kind, label);
                    audio_sources[deviceId] = label;
                }
            }

            for (const key in audio_sources) {
                $("#audio-source-select").append('<option value="' + key + '">' + audio_sources[key] + '</option>');
            }

            // Select second option as default
            curr_audio_source = Object.keys(audio_sources)[1];

        })
        .catch(err => { has_permission = false; console.error(err); return; });
}

function audioPlayerLoaded() {
    is_player_ready = true;
    audio_duration = player.duration();
}

function _createAudioPlayer(audio_url) {
    console.log("Audio URL: " + audio_url);

    player = new Howl({
        src: Array(audio_url),
        html5: true,
        autoplay: false,
        volume: 0.2,
        onload: audioPlayerLoaded,
        onplay: audioPlayed,
        onpause: audioPaused,
        onstop: audioStopped
    });
}
