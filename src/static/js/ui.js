////////////////////////////////////////////////////////////////
// UI Functions

// Dark Mode
$(document).on("click", "#dark-mode-toggle", function () {
    $("html").toggleClass("theme-dark");
    $("#top-navbar").toggleClass("has-background-dark has-background-light");
    $("#bottom-player").toggleClass("has-background-dark has-background-light");
    $("#top-navbar-title").toggleClass("has-text-primary-25 has-text-primary-25-invert");
    $(this).find("[data-fa-i2svg]").toggleClass("fa-moon fa-sun");
});

// Change cursor on hover for podcast boxes
$(document).on("mouseover", ".podcast-box", function () {
    this.style.cursor = "pointer";
});

// Render episodes when podcast box is clicked
$(document).on("click", ".podcast-box", function () {
    podcast_name = $(this).find("#podcast-name-display").text();

    // Check for default podcast and do nothing
    if ($(this).hasClass("default")) {
        $(this).click(false);
        return;
    }

    console.log("Clicked Podcast: " + podcast_name);
    now_playing_podname = podcast_name;

    removeAllChildren("#episodes-list-container");
    call_episodes_renderer(podcast_name);
});


/**
 * Event Handler for when a episode play button is clicked.
 * @function
 * @param {object} event - The event object.
 * @param {object} event.target - The target element of the event.
 * @param {string} podcast_name - The name of the podcast.
 * @listens click
 */
$(document).on("click", "#episode-play", function () {
    episode_number = $(this).attr("episode-number");
    get_episode_name = $(this).closest(".media-right").closest(".media").find("#episode-title")[0].innerText;
    get_episode_pubdate = $(this).closest(".media-right").closest(".media").find("#episode-pubdate")[0].innerText;

    // Check for default episode and do nothing
    get_parent_box = $(this).closest(".media-right").closest(".media").closest(".box")[0];
    if ($(get_parent_box).hasClass("default")) {
        $(this).click(false);
        return;
    }

    // Check for existing audio stream
    // and unload it first
    if (now_playing_podname != get_episode_name) {
        if (is_player_ready) {
            console.log("Unloading previous episode");
            player.stop();
            player.unload();
        }
    }

    // Update global variables
    now_playing_episode_name = get_episode_name;
    console.log("Clicked Play Episode: " + episode_number + " of " + now_playing_podname);
    console.log("Episode Name: " + now_playing_episode_name);

    // Load the episode
    $.ajax({
        url: "/load/" + now_playing_podname.toLowerCase().replaceAll(" ", "_") + "/" + episode_number,
        type: "POST",
        context: this,
        beforeSend: function () {
            console.log("Loading episode for playback");
            // Change the play button to a spinner
            $(this).find("[data-fa-i2svg]")
                .toggleClass("fa-play fa-spinner");
        },
        complete: function (data) {
            if (data.statusText != "OK") {
                console.log(data.statusText);
                return;
            } else {
                console.log("Loaded episode for playback");
                createAudioPlayerFromNowPlaying(now_playing_podname, episode_number);
            }

            // Update to playing state
            $(this).find("[data-fa-i2svg]")
                .toggleClass("fa-spinner fa-play");

            // Update UI
            // 1. update bottom player
            // 2. update center pane
            $("#bottom-player-episode-name").text(now_playing_episode_name);
            $("#bottom-player-podcast-name").text(now_playing_podname);
            $("#episode-center-title").text(now_playing_episode_name);
            $("#episode-center-pubdate").text(get_episode_pubdate);

            // Load episode image and 
            // 1. update bottom player
            // 2. update center pane
            $.ajax({
                url: "/load/img/" + now_playing_podname.toLowerCase().replaceAll(" ", "_"),
                type: "POST",
                success: function (data) {
                    console.log("Loaded episode image");
                    $("#bottom-player-image").attr("src", data.data);
                    $("#episode-center-image-large").attr("src", data.data);
                }
            });

            // Load episode summary and
            // 1. update center pane
            $.ajax({
                url: "/load/summary/" + now_playing_podname.toLowerCase().replaceAll(" ", "_") + "/" + episode_number,
                type: "POST",
                success: function (data) {
                    console.log("Loaded episode summary");
                    $("#episode-center-summary").html(data.data);
                }
            });
        },
    });

});