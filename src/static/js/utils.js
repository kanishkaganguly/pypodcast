////////////////////////////////////////////////////////////////
// Utility Functions
var now_playing_podname = null;
var now_playing_episode_name = null;
var player;
var player_id = 0;
var is_player_ready = false;
var audio_duration = 0;

function removeAllChildren(parent_element_id) {
    $(parent_element_id).empty();
}

/**
 * Disables all UI interactions before any audio is loaded.
 */
function disable_all_UI() {
    // Disable default episode play button
    $("#episode-play").click(false);

    // Disable play-pause button on bottom player
    $("#play-pause").click(false);

    // Disable progress slider on bottom player
    $("#progress-slider").val(0);
}