
var curr_audio_source = "default";

/**
 * Event Handler for when the audio source select element is changed.
 * Updates the current audio source if the player is ready and has permission.
 * @function
 * @listens change
 * @param {object} event - The event object.
 * @returns {void}
 */
function onChangeAudioSource() {
    if (is_player_ready && has_permission) {
        if ($("#audio-source-select").val() != curr_audio_source) {
            curr_audio_source = $("#audio-source-select").val();
            console.log("Audio Source: " + audio_sources[curr_audio_source]);
        }
    }
}

// Event Handler for when the audio source select element is changed
$(document).on("change", "#audio-source-select", onChangeAudioSource);