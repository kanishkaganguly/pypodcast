////////////////////////////////////////////////////////////////
// Render Components
const RenderType = {
  EPISODE: 1,
  PODCAST: 2,
  PLAYER: 3,
  CARD: 4,
  ADD: 5
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
      } else if (rendertype == RenderType.CARD) {
        $("#center-pane").append(data);
      } else if (rendertype == RenderType.ADD) {
        $("#add-podcast-container").append(data);
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
    url: "/render/episodes/" + podcast_name.toLowerCase().replaceAll(" ", "_"),
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
  removeAllChildren("#add-podcast-container");
  removeAllChildren("#podcasts-list-container");

  if (arguments.length == 0) {
    console.log("Loading from cache");
    var load_from_cache = "/render/podcast";
    call_url = load_from_cache;

    $.ajax({
      url: call_url,
      dataType: "html",
      type: "POST",
    }).done(function (data) {
      $("#podcasts-list-container").append(data);
    });
  }
}

/**
 * Calls the add podcast renderer and renders the add podcast form.
 *
 * This function will load the add podcast form from the server and append it
 * to the #add-podcast-container element.
 */
function call_add_podcast_renderer() {
  removeAllChildren("#podcasts-list-container");
  removeAllChildren("#add-podcast-container");

  $.ajax({
    url: "/render/add_podcast",
    dataType: "html",
    type: "GET",
  }).done(function (data) {
    $("#add-podcast-container").append(data);
  });
}

////////////////////////////////////////////////////////////////
// Page Load Functions

/**
 * Calls the default renderers for all types of content.
 * This is called when the page is loaded.
 */
$(function () {
  console.log("Loaded page");
  $("#podcasts-list-tab").click();
  call_default_renderer(RenderType.EPISODE);
  call_default_renderer(RenderType.PLAYER);
  call_default_renderer(RenderType.CARD);
  bulmaSlider.attach();

  disable_all_UI();
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
  $("#new-podcast-url-field").attr("value", "0");

  removeAllChildren("#podcasts-list-container");

  call_default_renderer(RenderType.ADD);
});

// Add New Podcast URL
$(document).on("click", "#new-podcast-url-submit", function () {
  console.log("Clicked Add New Podcast URL");
  var url = $("#new-podcast-url-input").val();

  $("#new-podcast-url-field").attr("value", "");
  add_new_podcast(url);
});

function add_new_podcast(url) {
  console.log("Adding New Podcast URL: " + url);

  var load_from_url = "/load/url";
  $.ajax({
    url: load_from_url,
    contentType: "application/json",
    type: "POST",
    data: JSON.stringify({ "url": url }),
  })
    .fail(function (data) {
      $("#new-podcast-progress").removeClass("is-primary");
      $("#new-podcast-progress").addClass("is-danger");
      $("#new-podcast-progress").attr("value", "100");
    })
    .done(function (data) {
      $("#podcasts-list-container").append(data);
      $("#new-podcast-progress").attr("value", "100");
    });
}