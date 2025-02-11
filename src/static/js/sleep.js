var sleep_timer = null;
var timer_progress = null;
var start_time = null;

/**
 * Event Handler for when the sleep timer slider is released.
 * Start the sleep timer.
 * @param {object} event - The event object.
 * @listens mouseup
 * @returns {void}
 */
$(document).on("mouseup", "#sleep-timer-slider", function () {
    var sleep_millis = $(this).val() * 60 * 1000;
    console.log("Sleep Timer: " + sleep_millis + " ms");
    startSleepTimer(sleep_millis);
});

/**
 *  Event Handler for when the sleep timer cancel button is clicked.
 *  Cancel the sleep timer.
 * @function
 * @param {object} event - The event object.
 * @param {object} event.target - The target element of the event.
 * @listens click
 * @returns {void}
 */
$(document).on("click", "#sleep-timer-cancel", function () {
    cancelSleepTimer(finished = false);
})

/**
 * Cancels the sleep timer.
 * Can be called to cancel the sleep timer on timer end or manually.
 * 
 * @param {boolean} [finished=false] If true, pause the player.
 * @returns {void}
 */
function cancelSleepTimer(finished = false) {
    if (sleep_timer != null) {
        console.log("Cancelling Sleep Timer");
        clearTimeout(sleep_timer);
        sleep_timer = null;
        clearInterval(timer_progress);

        if (finished) {
            player.pause();
        }
    }
}

/**
 * Updates the sleep timer progress bar at regular intervals.
 * Calculates the elapsed time and updates the progress bar's value
 * based on the proportion of time passed relative to the total sleep time.
 * 
 * @param {number} sleep_millis - The total sleep time in milliseconds.
 */

function sleepProgress(sleep_millis) {
    if (sleep_timer != null) {
        timer_progress = setInterval(function () {
            var curr_time = new Date().getTime();
            var elapsed_time = curr_time - start_time;
            var total_time = sleep_millis;
            var remaining_time = total_time - elapsed_time;
            var progress = (total_time - remaining_time) / total_time;
            console.log(total_time, elapsed_time, remaining_time, 1 - progress);
            $("#sleep-timer-progress").attr("value", 1 - progress);
        }, 1000);
    }
}

/**
 * Starts the sleep timer.
 * 
 * If the sleep timer is not already running, records the current time and
 * schedules a timeout to cancel the timer after the specified time.
 * 
 * @param {number} sleep_millis - The total sleep time in milliseconds.
 * @returns {void}
 */
function startSleepTimer(sleep_millis) {
    if (sleep_timer == null) {
        console.log("Starting Sleep Timer");
        start_time = new Date().getTime();
        sleep_timer = setTimeout(function () {
            cancelSleepTimer(finished = true);
        }, sleep_millis);

        sleepProgress(sleep_millis);
    }
}