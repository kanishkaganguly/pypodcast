from enum import IntEnum
from markupsafe import Markup
from flask import render_template


class RenderType(IntEnum):
    EPISODE = 1
    PODCAST = 2
    PLAYER = 3


def load_episode_template(default=True) -> str:
    if default:
        return render_template(
            "episode_template.html",
            episode_number="1",
            episode_name="Episode 1 Title",
            episode_description="Episode Description",
            episode_duration="00:00:00",
        )
    else:
        print("Custom Episodes Render")

    return ""


def load_podcast_template(default=True) -> str:
    if default:
        return render_template(
            "podcast_template.html",
            podcast_name="Podcast 1",
            podcast_image="https://placehold.co/128x128/orange/white?text=Podcast+1",
        )
    else:
        print("Custom Podcasts Render")
    return ""


def load_bottomplayer(default=True) -> str:
    with open("src/templates/bottom_player.html", "r") as bottom_player:
        return Markup(bottom_player.read())
