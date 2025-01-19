////////////////////////////////////////////////////////////////
// Utility Functions
function removeAllChildren(parent_element_id) {
  $(parent_element_id).empty();
}

////////////////////////////////////////////////////////////////
// Render Components
const RenderType = {
  EPISODE: 1,
  PODCAST: 2,
  PLAYER: 3,
};

function call_default_renderer(rendertype) {
  $.ajax({
    url: "/render?rendertype=" + rendertype + "&default=true",
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

function call_episodes_renderer() {
  $.ajax({
    url: "/render?rendertype=" + RenderType.EPISODE + "&default=false",
    dataType: "html",
    success: function (data) {
      $("#episodes-list-container").append(data);
    },
  });
}

function call_podcasts_renderer() {
  $.ajax({
    url: "/render?rendertype=" + RenderType.PODCAST + "&renderdefault=false",
    dataType: "html",
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

  $.ajax({
    url: "/control/volume/" + $(this).val(),
    type: "POST",
  });
});
////////////////////////////////////////////////////////////////
// Progress Slider
$(document).on("mouseup", "#progress-slider", function (e) {
  $.ajax({
    url: "/control/seek/" + $(this).val(),
    type: "POST",
  });
});

////////////////////////////////////////////////////////////////
// Player Controls

const ControlType = {
  PLAY: 1,
  PAUSE: 2,
  NEXT: 3,
  PREV: 4,
};

$(document).on("click", "#play-pause", function () {
  console.log("Clicked Play/Pause");
  var is_paused = $(this).hasClass("paused");

  if (is_paused) {
    $(this).find("[data-fa-i2svg]").toggleClass("fa-play").toggleClass("fa-pause");
    $.ajax({
      url: "/control/player/" + ControlType.PLAY,
      type: "POST",
    });
    $(this).removeClass("paused");
  } else {
    $(this).find("[data-fa-i2svg]").toggleClass("fa-play").toggleClass("fa-pause");
    $.ajax({
      url: "/control/player/" + ControlType.PAUSE,
      type: "POST",
    });
    $(this).addClass("paused");
  }
});

$(document).on("click", "#prev", function () {
  console.log("Clicked Previous");
  $.ajax({
    url: "/control/player/" + ControlType.PREV,
    type: "POST",
  });
});

$(document).on("click", "#next", function () {
  console.log("Clicked Next");
  $.ajax({
    url: "/control/player/" + ControlType.NEXT,
    type: "POST",
  });
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