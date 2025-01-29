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

////////////////////////////////////////////////////////////////
// Audio Functions

function createAudioPlayerFromNowPlaying(now_playing_podname, episode_number) {
  $.ajax({
    url: "/get_episode_url/" + now_playing_podname.toLowerCase() + "/" + episode_number,
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
    url: "/load/" + now_playing_podname.toLowerCase() + "/" + episode_number,
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

      // Update bottom player
      $("#bottom-player-episode-name").text(now_playing_episode_name);
      $("#bottom-player-podcast-name").text(now_playing_podname);

      // Load episode image and update bottom player
      $.ajax({
        url: "/load/img/" + now_playing_podname.toLowerCase(),
        type: "POST",
        success: function (data) {
          console.log("Loaded episode image");
          $("#bottom-player-image").attr("src", data.data);
        }
      });
    },
  });

});

////////////////////////////////////////////////////////////////
// Render Components
const RenderType = {
  EPISODE: 1,
  PODCAST: 2,
  PLAYER: 3,
};

/**
 * Renders default content for a specified type by sending an AJAX request.
 *
 * Depending on the rendertype, it appends the retrieved HTML data to the
 * appropriate container: episodes-list-container, podcasts-list-container,
 * or bottom-player.
 *
 * @param {number} rendertype - The type of content to render. Should be one
 * of the properties of RenderType (EPISODE, PODCAST, PLAYER).
 */

function call_default_renderer(rendertype) {
  $.ajax({
    url: "/render/default/" + rendertype,
    dataType: "html",
    success: function (data) {
      if (rendertype == RenderType.EPISODE) {
        $("#episodes-list-container").append(data);
      } else if (rendertype == RenderType.PODCAST) {
        $("#podcasts-list-container").append(data);
      } else if (rendertype == RenderType.PLAYER) {
        $("#bottom-player").append(data);
      }
    },
  });
}

/**
 * Calls the episodes renderer and renders the episodes for the given podcast.
 *
 * @param {string} podcast_name The name of the podcast to render episodes for.
 */
function call_episodes_renderer(podcast_name) {
  $.ajax({
    url: "/render/episodes/" + podcast_name.toLowerCase(),
    type: "POST",
    dataType: "html",
  }).done(function (data) {
    $("#episodes-list-container").append(data);
  });
}

/**
 * Calls the podcasts renderer and renders the podcasts from a given URL or
 * loads them from cache.
 *
 * @param {string} [url] The URL to load the podcasts from. If not provided,
 * the podcasts are loaded from cache.
 */
function call_podcasts_renderer(url) {
  if (arguments.length == 0) {
    var load_from_cache = "/render/podcast";
    call_url = load_from_cache;
  } else {
    var load_from_url = "/render/podcasts/" + url;
    call_url = load_from_url;
  }

  removeAllChildren("#podcasts-list-container");

  $.ajax({
    url: call_url,
    dataType: "html",
    type: "POST",
  }).done(function (data) {
    $("#podcasts-list-container").append(data);
  });
}


////////////////////////////////////////////////////////////////
// Page Load Functions

/**
 * Calls the default renderers for all types of content.
 * This is called when the page is loaded.
 */
$(function () {
  for (let i = 0; i < 5; i++) {
    call_default_renderer(RenderType.PODCAST);
  }
  call_default_renderer(RenderType.EPISODE);
  call_default_renderer(RenderType.PLAYER);
  bulmaSlider.attach();

  disable_all_UI();
});

////////////////////////////////////////////////////////////////
// Volume Slider

$(document).on("input change", "#volume-slider", function () {
  $("#volume-value").text($(this).val());
  $("#volume-display").attr("value", $(this).val());
});

$(document).on("mouseup", "#volume-slider", function (e) {
  e.preventDefault();

  console.log("Volume: " + $(this).val() / 100.0);
  player.volume($(this).val() / 100.0);
});
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

////////////////////////////////////////////////////////////////
// Player Controls

$(document).on("click", "#play-pause", function () {
  console.log("Clicked Play/Pause");
  var is_paused = $(this).hasClass("paused");

  if (is_paused) {
    $(this).find("[data-fa-i2svg]").toggleClass("fa-play").toggleClass("fa-pause");

    if (is_player_ready) {
      player.play();
    }

    $(this).removeClass("paused");
  } else {
    $(this).find("[data-fa-i2svg]").toggleClass("fa-play").toggleClass("fa-pause");

    if (is_player_ready) {
      player.pause();
    }

    $(this).addClass("paused");
  }
});

$(document).on("click", "#prev", function () {
  console.log("Clicked Previous");

});

$(document).on("click", "#next", function () {
  console.log("Clicked Next");

});
////////////////////////////////////////////////////////////////
// Podcast Tabs
$(document).on("click", "#podcasts-list-tab", function () {
  console.log("Clicked Podcasts Tab");
  $("#podcasts-list-tab").addClass("is-active");
  $("#new-podcasts-tab").removeClass("is-active");
  $("#podcasts-list-container").removeClass("is-invisible");
  $("#add-podcast-container").addClass("is-invisible");

  removeAllChildren("#podcasts-list-container");

  call_podcasts_renderer();
});
////////////////////////////////////////////////////////////////
// New Podcast Tab
$(document).on("click", "#new-podcasts-tab", function () {
  console.log("Clicked New Podcasts Tab");
  $("#podcasts-list-tab").removeClass("is-active");
  $("#new-podcasts-tab").addClass("is-active");
  $("#podcasts-list-container").addClass("is-invisible");
  $("#add-podcast-container").removeClass("is-invisible");
});