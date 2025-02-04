////////////////////////////////////////////////////////////////
// Audio Functions

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
        onplay: updateProgressDisplay,
        onpause: stopProgressChecker,
        onstop: stopProgressChecker
    });
}
