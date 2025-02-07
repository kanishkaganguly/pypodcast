/**
 * Event Handler for when the playback speed slider is clicked and held down.
 * Pause playback while changing value.
 */
$(document).on("mousedown", "#playback-speed-slider", function (e) {
    if (is_player_ready) {
        player.pause();
    }
});


/**
 * Event Handler for when the playback speed slider is released.
 * Set playback rate and resume playback.
 */
$(document).on("mouseup", "#playback-speed-slider", function (e) {
    if (is_player_ready) {
        console.log("Speed: " + $(this).val());
        player.rate($(this).val());
        player.play();
    }
});