from flask import Flask, render_template, url_for

from src.render import (
    RenderType,
    load_default_episode,
    load_custom_episode,
    load_default_podcast,
    load_custom_podcast,
    load_bottomplayer,
)

from src.playback import Playback

app = Flask(__name__)


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
        return url_for(
            "static", _external=True, filename=f"audio/{podname}-{episode}.mp3"
        )
    except FileNotFoundError as e:
        return str(e), 404


@app.route("/load/<podname>/<episode>", methods=["POST"])
def playback(podname, episode) -> str | None:
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

    if audio_fetched:
        return "OK"
    else:
        return "ERROR"


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

    return ""


@app.route("/render/episodes/<podname>", methods=["POST"])
def render_episodes(podname) -> str | None:
    print(f"Render Episodes for Podcast: {podname}")
    return load_custom_episode(podname)
    return "OK"


@app.route("/render/podcast", methods=["POST"])
def render_podcast_from_cache() -> str | None:
    print(f"Render Podcast From Cache")
    return load_custom_podcast()
    return "OK"


@app.route("/render/podcast/<url>")
def render_podcast_from_url(url) -> str | None:
    print(f"Render Podcast From URL: {url}")
    return "OK"
