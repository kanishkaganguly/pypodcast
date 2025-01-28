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

$(document).on("click", "#dark-mode-toggle", function () {
  $("html").toggleClass("theme-dark");
  $("#top-navbar").toggleClass("has-background-dark has-background-light");
  $("#bottom-player").toggleClass("has-background-dark has-background-light");
  $("#top-navbar-title").toggleClass("has-text-primary-25 has-text-primary-25-invert");
  $(this).find("[data-fa-i2svg]").toggleClass("fa-moon fa-sun");
});

$(document).on("mouseover", ".podcast-box", function () {
  this.style.cursor = "pointer";
});

$(document).on("click", ".podcast-box", function () {
  podcast_name = $(this).find("#podcast-name-display").text();
  console.log("Clicked Podcast: " + podcast_name);
  now_playing_podname = podcast_name;

  removeAllChildren("#episodes-list-container");
  call_episodes_renderer(podcast_name);
});

$(document).on("click", "#episode-play", function () {
  episode_number = $(this).attr("episode-number");
  get_episode_name = $(this).closest(".media-right").closest(".media").find("#episode-title")[0].innerText;

  // Check for existing audio stream
  // and unload it first
  if (now_playing_podname != get_episode_name) {
    if (is_player_ready) {
      console.log("Unloading previous episode");
      player.stop();
      player.unload();
    }
  }
  now_playing_episode_name = get_episode_name;
  console.log("Clicked Play Episode: " + episode_number + " of " + now_playing_podname);
  console.log("Episode Name: " + now_playing_episode_name);

  // Change the play button to a spinner
  $(this)
    .find("[data-fa-i2svg]")
    .toggleClass("fa-play")
    .toggleClass("fa-spinner");

  // Load the episode
  $.ajax({
    url: "/load/" + now_playing_podname.toLowerCase() + "/" + episode_number,
    type: "POST",
    beforeSend: function () {
      console.log("Loading episode for playback");
    },
    complete: function (data) {
      if (data.statusText != "OK") {
        console.log(data.statusText);
        return;
      } else {
        console.log("Loaded episode for playback");
        createAudioPlayerFromNowPlaying(now_playing_podname, episode_number);
      }
    }
  });

  // Update the UI
  $(this)
    .find("[data-fa-i2svg]")
    .toggleClass("fa-play")
    .toggleClass("fa-spinner");
  $("#bottom-player-episode-name").text(now_playing_episode_name);
  $("#bottom-player-podcast-name").text(now_playing_podname);
});

////////////////////////////////////////////////////////////////
// Render Components
const RenderType = {
  EPISODE: 1,
  PODCAST: 2,
  PLAYER: 3,
};

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

function call_episodes_renderer(podcast_name) {
  $.ajax({
    url: "/render/episodes/" + podcast_name.toLowerCase(),
    type: "POST",
    dataType: "html",
    success: function (data) {
      $("#episodes-list-container").append(data);
    },
  });
}

function call_podcasts_renderer(url) {
  if (arguments.length == 0) {
    var load_from_cache = "/render/podcast";
    call_url = load_from_cache;
  } else {
    var load_from_url = "/render/podcasts/" + url;
    call_url = load_from_url;
  }

  $.ajax({
    url: call_url,
    dataType: "html",
    type: "POST",
    success: function (data) {
      $("#podcasts-list-container").append(data);
    },
  });
}

$(function () {
  for (let i = 0; i < 5; i++) {
    call_default_renderer(RenderType.PODCAST);
  }
  call_default_renderer(RenderType.EPISODE);
  call_default_renderer(RenderType.PLAYER);
  bulmaSlider.attach();
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
    // console.log("Progress: " + (curr_progress / audio_duration) * 100);
    $("#progress-slider").val((curr_progress / audio_duration) * 100);
    $("output[for='progress-slider']").text(Math.round((curr_progress / audio_duration) * 100));
  });
}
function stopProgressChecker() {
  clearInterval(progressCheckerInterval);
}

// Set progress
$(document).on("mousedown", "#progress-slider", function (e) {
  player.pause();
});

$(document).on("mouseup", "#progress-slider", function (e) {
  curr_seek = audio_duration * ($(this).val() / 100.0);
  console.log("Seek To: " + curr_seek);
  player.seek(curr_seek);

  player.play();
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