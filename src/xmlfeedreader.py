import requests as req
from dataclasses import dataclass, field
import xmltodict
from pathlib import Path
from typing import List, Tuple
from datetime import datetime, timedelta
import time
import json
from src.paths import Paths
from thefuzz import process as fzp


class FeedReader:

    @dataclass
    class Podcast:
        title: str = ""
        link: str = ""
        image: str = ""
        category: List = field(default_factory=list)
        owner: str = ""
        description: str = ""
        episodes: List = field(default_factory=list)

    @dataclass
    class Episode:
        title: str = ""
        episode_num: int = -1
        pub_date: datetime = None
        summary: str = ""
        url: str = ""
        duration_seconds: float = -1.0

    def __init__(self, feed_name: str, feed_url: str) -> None:
        self.feed_name = feed_name
        self.feed_url = feed_url
        self.podcast_info: FeedReader.Podcast = self.Podcast()

    @staticmethod
    def get_podcast_name_from_metadata(raw_podcast_name: str) -> Tuple[bool, str, str]:
        """
        Get the valid podcast name from metadata.

        Returns:
            Tuple[bool, str, str]: (success, name, metadata content)
        """
        pod_file_path = Path(Paths.metadata)
        with open(pod_file_path, "r") as f:
            metadata = json.load(f)

        raw_podcast_name = raw_podcast_name.strip().lower()
        raw_podcast_name = raw_podcast_name.replace(" ", "_")

        matches = fzp.extractOne(raw_podcast_name, list(metadata.keys()))
        # matches[0] = name, matches[1] = score
        # metadata[matches[0]] = { 'feed_url': '...', 'feed_last_update': '...' }
        if matches is not None and matches[1] > 80:
            return (True, matches[0], metadata[matches[0]])

        return (False, "", "")

    def find_episode(self, episode_num: int) -> Tuple[bool, None | Episode]:
        for episode in self.podcast_info.episodes:
            if episode.episode_num == episode_num:
                return (True, episode)  # Found
        return (False, None)

    def fetch_feed(self) -> None:
        update_now: bool = False

        # Fetch existing metadata
        pod_metadata_path = Path(Paths.metadata)
        metadata = {}
        if pod_metadata_path.exists():
            with open(pod_metadata_path, "r") as f:
                try:
                    metadata = json.load(f)
                except json.decoder.JSONDecodeError:
                    pass

        # Data to update into metadata
        data = {}

        # Download feed if last update is older than 24 hours
        if self.feed_name in metadata.keys():
            data["feed_url"] = metadata[self.feed_name]["feed_url"]

            last_update: datetime = (
                datetime.strptime(
                    metadata[self.feed_name]["feed_last_update"], "%Y-%m-%d %H:%M:%S"
                )
                if "feed_last_update" in metadata[self.feed_name].keys()
                else datetime.now()
            )

            update_delta = datetime.now() - last_update
            print(f"Update delta: {update_delta.total_seconds()} seconds")

            # Fetch feed if last update is older than 24 hours
            if update_delta.total_seconds() > 86400 or update_now:
                print("Downloading feed")
                pod_xml = req.get(self.feed_url).text
                with open(f"{Paths.cache}/{self.feed_name}.xml", "w") as f:
                    f.write(pod_xml)
                data["feed_last_update"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            else:
                # Keep last update timestamp if not updated
                data["feed_last_update"] = last_update.strftime("%Y-%m-%d %H:%M:%S")
                print("Using cached feed")

        # Update metadata
        with open(pod_metadata_path, "w") as f:
            metadata[self.feed_name] = data
            json.dump(metadata, f)

    def parse_feed(self) -> None:
        root = None
        with open(f"{Paths.cache}/{self.feed_name}.xml", "r") as f:
            root = f.read()

        # Handle multiple categories edge-case
        podcast_dict = xmltodict.parse(
            root, xml_attribs=True, force_list="itunes:category"
        )

        self.podcast_info.title = podcast_dict["rss"]["channel"]["title"]
        self.podcast_info.link = podcast_dict["rss"]["channel"]["link"]
        self.podcast_info.image = podcast_dict["rss"]["channel"]["image"]["url"]
        # Handle multiple categories edge-case
        for category in podcast_dict["rss"]["channel"]["itunes:category"]:
            self.podcast_info.category.append(category["@text"])
        self.podcast_info.owner = podcast_dict["rss"]["channel"]["itunes:owner"][
            "itunes:name"
        ]
        self.podcast_info.description = podcast_dict["rss"]["channel"]["description"]
        self.podcast_info.description.strip().replace("\n", " ")

        for episode in podcast_dict["rss"]["channel"]["item"]:
            episode_data: FeedReader.Episode = self.Episode()
            episode_data.title = episode["title"]
            episode_data.episode_num = int(episode["itunes:episode"])
            episode_data.pub_date = datetime.strptime(
                episode["pubDate"], "%a, %d %b %Y %H:%M:%S %z"
            )
            episode_data.summary = episode["description"]
            episode_data.url = episode["enclosure"]["@url"]

            # Handle time parsing edge-cases

            # Can be in HH:MM:SS format
            if ":" in episode["itunes:duration"]:
                time_parsed = time.strptime(episode["itunes:duration"], "%H:%M:%S")
                episode_data.duration_seconds = timedelta(
                    hours=time_parsed.tm_hour,
                    minutes=time_parsed.tm_min,
                    seconds=time_parsed.tm_sec,
                ).total_seconds()
            # Or given as seconds directly
            else:
                episode_data.duration_seconds = float(episode["itunes:duration"])

            self.podcast_info.episodes.append(episode_data)


if __name__ == "__main__":
    feed = FeedReader("necronomipod", "https://feeds.megaphone.fm/necronomipod")
    feed.fetch_feed()
    feed.parse_feed()

    feed2 = FeedReader(
        "last_podcast_on_the_left", "https://feeds.simplecast.com/dCXMIpJz"
    )
    feed2.fetch_feed()
    feed2.parse_feed()

    # print(FeedReader.get_podcast_name_from_metadata("necronomipod"))
    # print(FeedReader.get_podcast_name_from_metadata("last podcast"))
