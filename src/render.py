from enum import IntEnum
from markupsafe import Markup
from flask import render_template
from src.xmlfeedreader import FeedReader
import json
from datetime import timedelta, datetime
from src.paths import Paths


class RenderType(IntEnum):
    EPISODE = 1
    PODCAST = 2
    PLAYER = 3
    CARD = 4


def load_default_episode(podcast_name=None) -> str:
    print("Default Episodes Render")
    return render_template(
        "episode_template.html",
        episode_number="1",
        episode_name="Episode 1 Title",
        episode_description="Episode Description",
        episode_duration="00:00:00",
        is_default="default",
    )


def load_custom_episode(podcast_name=None) -> str:
    print("Custom Episodes Render")
    episodes_render_list = []
    if podcast_name is not None:
        print("Rendering episodes for: " + podcast_name)
        res, podcast_name, podcast_url = FeedReader.get_podcast_name_from_metadata(
            podcast_name
        )
        if res:
            feed = FeedReader(podcast_name, podcast_url)
            feed.fetch_feed()
            feed.parse_feed()

            for episode in feed.podcast_info.episodes:
                episodes_render_list.append(
                    render_template(
                        "episode_template.html",
                        episode_number=f"{episode.episode_num}",
                        episode_name=f"{episode.title}",
                        episode_duration=f"{str(timedelta(seconds=episode.duration_seconds))}",
                        episode_pubdate=f"{str(datetime.strftime(episode.pub_date, '%a, %m-%d-%Y'))}",
                        is_default="custom",
                    )
                )
            return "\n".join(episodes_render_list)
        else:
            return ""


def load_default_podcast() -> str:
    print("Default Podcasts Render")
    return render_template(
        "podcast_template.html",
        podcast_name="Podcast 1",
        podcast_image="https://placehold.co/128x128/orange/white?text=Podcast+1",
        is_default="default",
    )


def load_custom_podcast(podcast_name=None) -> str:
    print("Custom Podcasts Render")

    feed = None
    template_list = []
    with open(Paths.metadata, "r") as f:
        try:
            metadata = json.load(f)
        except json.decoder.JSONDecodeError:
            metadata = {}

        for pod_name, pod_metadata in metadata.items():
            feed = FeedReader(pod_name, pod_metadata["feed_url"])
            feed.fetch_feed()
            feed.parse_feed()

            template_list.append(
                render_template(
                    "podcast_template.html",
                    podcast_name=feed.podcast_info.title,
                    podcast_image=feed.podcast_info.image,
                    podcast_owner=feed.podcast_info.owner,
                    podcast_description=feed.podcast_info.description,
                    is_default="custom",
                )
            )

    return "\n".join(template_list)


def load_bottomplayer() -> str:
    with open("src/templates/bottom_player.html", "r") as bottom_player:
        return Markup(bottom_player.read())


def load_episode_card() -> str:
    with open("src/templates/episode_card.html", "r") as episode_card:
        return Markup(episode_card.read())
