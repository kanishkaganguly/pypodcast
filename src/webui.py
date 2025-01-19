from flask import Flask, render_template, render_template_string, request
from src.render import (
    load_episode_template,
    load_podcast_template,
    load_bottomplayer,
    RenderType,
)
from src.controls import (
    ControlType,
    _play,
    _pause,
    _next,
    _prev,
    _set_volume,
    _set_seek_seconds,
)

app = Flask(__name__)


@app.route("/")
def render_base() -> str:
    return render_template("base.html")


@app.route("/control/player/<cmd>", methods=["POST"])
def control(cmd) -> str | None:
    print(f"Control: {cmd}")
    if int(cmd) == ControlType.PLAY:
        _play()
    if int(cmd) == ControlType.PAUSE:
        _pause()
    if int(cmd) == ControlType.NEXT:
        _next()
    if int(cmd) == ControlType.PREV:
        _prev()

    return "OK"


@app.route("/control/volume/<vol>", methods=["POST"])
def control_vol(vol) -> str | None:
    print(f"Control: {vol}")
    _set_volume(int(vol))
    return "OK"


@app.route("/control/seek/<seconds>", methods=["POST"])
def control_seek(seconds) -> str | None:
    print(f"Seek: {seconds}")
    _set_seek_seconds(int(seconds))
    return "OK"


@app.route("/render")
def render_components() -> str | None:
    render_type: int = request.args.get("rendertype", default="1", type=int)
    render_default: str = request.args.get("renderdefault", default="true", type=str)
    render_default_bool: bool = True if render_default == "true" else False
    print(f"Render Default: {render_default_bool}")

    if render_type == RenderType.EPISODE:
        print("Render Episode")
        return render_template_string(
            load_episode_template(default=render_default_bool)
        )
    if render_type == RenderType.PODCAST:
        print("Render Podcast")
        return render_template_string(
            load_podcast_template(default=render_default_bool)
        )
    if render_type == RenderType.PLAYER:
        print("Render Player")
        return render_template_string(load_bottomplayer(default=render_default_bool))

    return None


@app.route("/render/podcast/<url>")
def render_podcast(url) -> str | None:
    print(f"Render Podcast: {url}")
