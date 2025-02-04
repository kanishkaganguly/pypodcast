from flask import Flask, render_template, url_for, jsonify, request
from flask_caching import Cache

from src.render import (
    RenderType,
    load_default_episode,
    load_custom_episode,
    load_default_podcast,
    load_custom_podcast,
    load_bottomplayer,
    load_episode_card,
    load_add_podcast,
)
from src.playback import Playback
from src.xmlfeedreader import FeedReader
from urllib.parse import unquote

# Set up Flask-Caching configuration
config = {
    "DEBUG": True,  # some Flask specific configs
    "CACHE_TYPE": "SimpleCache",  # Flask-Caching related configs
    "CACHE_DEFAULT_TIMEOUT": 3600,
}

app = Flask(__name__)

# Set up Flask-Caching from the imported config
app.config.from_mapping(config)
cache = Cache(app)


############################
# Base route
############################
@app.route("/")
def render_base() -> str:
    """
    GET /

    The base route. Serves the HTML template for the entire web interface.
    """
    return render_template("base.html")


############################
# Playback routes
############################
@app.route("/get_episode_url/<podname>/<episode>", methods=["GET"])
def get_episode_url(podname, episode) -> str | None:
    """
    GET /get_episode_url/<podname>/<episode>

    Returns the URL of the MP3 file for the specified episode of the specified podcast.

    :param podname: The name of the podcast.
    :param episode: The episode number.
    :return: The URL of the MP3 file if it exists, 404 otherwise.
    """
    try:
        return unquote(
            url_for("static", _external=True, filename=f"audio/{podname}-{episode}.mp3")
        )
    except FileNotFoundError as e:
        return str(e), 404


@app.route("/load/<podname>/<episode>", methods=["POST"])
def load_episode_audio(podname, episode) -> str | None:
    """
    POST /load/<podname>/<episode>

    Loads the specified episode and fetches its audio.

    :param podname: The name of the podcast.
    :param episode: The episode number.
    :return: "OK" if the episode audio was fetched, "ERROR" otherwise.
    """
    print(f"Playback: {podname} - {episode}")

    playback = Playback(podname, int(episode))

    if playback.load_episode():
        audio_fetched = playback.fetch_audio()

        cache.set("playback_object", playback)

    if audio_fetched:
        return jsonify(status=200, mimetype="text/plain", data="OK")
    else:
        return jsonify(status=500, mimetype="text/plain", data="ERROR")


@app.route("/load/img/<podname>", methods=["POST"])
def load_podcast_image(podname) -> str | None:
    """
    POST /load/img/<podname>

    Loads the image for the specified podcast.

    :param podname: The name of the podcast.
    :return: The URL of the image if it exists, a placeholder otherwise.
    """
    print(f"Load Podcast Image: {podname}")

    img = "https://bulma.io/assets/images/placeholders/128x128.png"
    if cache.has("playback_object"):
        playback = cache.get("playback_object")
        cover = playback.fetch_cover()
        if cover[0]:
            img = cover[1]
            cache.set(f"podcast_image_{podname}", img)

    return jsonify(status=200, mimetype="text/plain", data=img)


@app.route("/load/summary/<podname>/<episode>", methods=["POST"])
def load_podcast_summary(podname, episode) -> str | None:
    """
    POST /load/summary/<podname>/<episode>

    Loads the summary for the specified episode of the specified podcast.

    :param podname: The name of the podcast.
    :param episode: The episode number.
    :return: The summary of the episode if it exists, 404 otherwise.
    """
    print(f"Load Podcast Summary: {podname}")

    summary = ""
    if cache.has("playback_object"):
        playback = cache.get("playback_object")
        summary = playback.fetch_episode_summary(int(episode))
        if summary[0]:
            summary = summary[1]
            cache.set(f"podcast_summary_{podname}_{episode}", summary)

    return jsonify(status=200, mimetype="text/plain", data=summary)


@app.route("/load/url", methods=["POST"])
def load_podcast_from_url() -> str | None:
    """
    POST /load/url

    Loads a podcast from a given URL.

    Expects a JSON payload containing a "url" field which specifies the
    podcast's RSS feed URL. Prints the URL to the console for logging
    purposes.

    :return: "OK" if the request is processed successfully.
    """

    data = request.get_json()
    url = data["url"]
    print(f"Load Podcast From URL: {url}")

    new_feed = FeedReader.init_from_url(url)
    if new_feed is None:
        return jsonify(status=500, mimetype="text/json", data="ERROR")
    else:
        new_feed.fetch_feed()
        new_feed.parse_feed()
        return jsonify(status=200, mimetype="text/json", data="OK")


############################
# Render routes
############################
@app.route("/render/default/<rendertype>", methods=["GET"])
def render_components(rendertype) -> str | None:
    """
    GET /render/default/<rendertype>

    Renders default content for a given type.

    :param rendertype: The type of content to render. Should be one of the
        properties of RenderType (EPISODE, PODCAST, PLAYER, CARD, ADD).

    :returns: The rendered content as a string.
    """
    render_type: int = int(rendertype)

    print(f"Render Default {RenderType(render_type).name}")

    if render_type == RenderType.EPISODE:
        print("Render Episode")
        return load_default_episode()
    if render_type == RenderType.PODCAST:
        print("Render Podcast")
        return load_default_podcast()
    if render_type == RenderType.PLAYER:
        print("Render Player")
        return load_bottomplayer()
    if render_type == RenderType.CARD:
        print("Render Card")
        return load_episode_card()
    if render_type == RenderType.ADD:
        print("Render Add")
        return load_add_podcast()

    return ""


@app.route("/render/add_podcast", methods=["GET"])
def render_add_podcast() -> str | None:
    """
    GET /render/add_podcast

    Renders the add new podcast form.

    :returns: The rendered form as a string.
    """
    print(f"Render Add Podcast")
    return load_add_podcast()


@app.route("/render/episodes/<podname>", methods=["POST"])
def render_episodes(podname) -> str | None:
    """
    POST /render/episodes/<podname>

    Renders the episodes for the specified podcast.

    :param podname: The name of the podcast for which to render episodes.
    :return: The rendered episodes as a string.
    """

    print(f"Render Episodes for Podcast: {podname}")
    return load_custom_episode(podname)


@app.route("/render/podcast", methods=["POST"])
def render_podcast_from_cache() -> str | None:
    """
    POST /render/podcast

    Renders the podcasts from cached data.

    :return: The rendered podcasts as a string if available, None otherwise.
    """

    print(f"Render Podcast From Cache")
    return load_custom_podcast()
