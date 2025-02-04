////////////////////////////////////////////////////////////////
// Progress Slider

// Update progress display
var progressCheckerInterval = null;
function updateProgressDisplay() {
    progressCheckerInterval = setInterval(function () {

        curr_progress = player.seek();
        $("#progress-slider").val((curr_progress / audio_duration) * 100);

        hours = Math.floor(curr_progress / 3600);
        curr_progress %= 3600;
        minutes = Math.floor(curr_progress / 60);
        seconds = curr_progress % 60;
        $("#bottom-player-duration").text(
            (hours + "").padStart(2, "0")
            + ":"
            + (minutes + "").padStart(2, "0")
            + ":"
            + (Math.round(seconds) + "").padStart(2, "0")
        );
    }, 1000);
}
function stopProgressChecker() {
    clearInterval(progressCheckerInterval);
}

// Set progress
$(document).on("mousedown", "#progress-slider", function (e) {
    if (is_player_ready) {
        player.pause();
    }
});

$(document).on("mouseup", "#progress-slider", function (e) {
    curr_seek = audio_duration * ($(this).val() / 100.0);
    console.log("Seek To: " + curr_seek);

    if (is_player_ready) {
        player.seek(curr_seek);
        player.play();
    }
});