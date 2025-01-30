from flask import Flask, render_template, url_for, jsonify
from flask_caching import Cache

from src.render import (
    RenderType,
    load_default_episode,
    load_custom_episode,
    load_default_podcast,
    load_custom_podcast,
    load_bottomplayer,
    load_episode_card,
)
from urllib.parse import unquote
from src.playback import Playback

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
    print(f"Load Podcast Summary: {podname}")

    summary = ""
    if cache.has("playback_object"):
        playback = cache.get("playback_object")
        summary = playback.fetch_episode_summary(int(episode))
        if summary[0]:
            summary = summary[1]
            cache.set(f"podcast_summary_{podname}_{episode}", summary)

    return jsonify(status=200, mimetype="text/plain", data=summary)


############################
# Render routes
############################
@app.route("/render/default/<rendertype>", methods=["GET"])
def render_components(rendertype) -> str | None:
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

    return ""


@app.route("/render/episodes/<podname>", methods=["POST"])
def render_episodes(podname) -> str | None:
    print(f"Render Episodes for Podcast: {podname}")
    return load_custom_episode(podname)


@app.route("/render/podcast", methods=["POST"])
def render_podcast_from_cache() -> str | None:
    print(f"Render Podcast From Cache")
    return load_custom_podcast()


@app.route("/render/podcast/<url>")
def render_podcast_from_url(url) -> str | None:
    print(f"Render Podcast From URL: {url}")
    return "OK"
