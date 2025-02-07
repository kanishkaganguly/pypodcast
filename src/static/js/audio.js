////////////////////////////////////////////////////////////////
// Audio Functions

function audioPlayed() {
    // Update progress bar
    updateProgressDisplay();

    // Set play/pause button
    $("#play-pause").find("[data-fa-i2svg]").toggleClass("fa-play").toggleClass("fa-pause");
    $("#play-pause").removeClass("paused");
}

function audioPaused() {
    // Stop progress bar
    stopProgressChecker();

    // Set play/pause button
    $("#play-pause").find("[data-fa-i2svg]").toggleClass("fa-play").toggleClass("fa-pause");
    $("#play-pause").addClass("paused");
}

function audioStopped() {
    // Stop progress bar
    stopProgressChecker();

    // Set play/pause button
    $("#play-pause").find("[data-fa-i2svg]").toggleClass("fa-play").toggleClass("fa-pause");
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
