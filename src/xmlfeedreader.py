import requests as req
from dataclasses import dataclass, field
import xmltodict
from pathlib import Path
from typing import List
from datetime import datetime


class FeedReader:

    @dataclass
    class Podcast:
        title: str = None
        link: str = None
        image: str = None
        category: str = None
        episodes: List = field(default_factory=list)

    @dataclass
    class Episode:
        title: str = None
        episode_num: int = None
        pub_date: datetime = None
        summary: str = None
        url: str = None
        duration_seconds: float = None

    def __init__(self, feed_name: str, feed_url: str) -> None:
        self.feed_name = feed_name
        self.feed_url = feed_url
        self.podcast_info: Podcast = self.Podcast()

    def fetch_feed(
        self,
        write_to_file: bool = True,
        file_path: Path = None,
    ) -> None:

        if write_to_file and file_path is None:
            pod_file_path = Path(f"src/cache/{self.feed_name}.xml")

        pod_xml = req.get(self.feed_url).text

        if write_to_file:
            with open(pod_file_path, "w") as f:
                f.write(pod_xml)

    def parse_feed(self) -> None:
        root = None
        with open(f"src/cache/{self.feed_name}.xml", "r") as f:
            root = f.read()

        podcast_dict = xmltodict.parse(root, xml_attribs=True)

        self.podcast_info.title = podcast_dict["rss"]["channel"]["title"]
        self.podcast_info.link = podcast_dict["rss"]["channel"]["link"]
        self.podcast_info.image = podcast_dict["rss"]["channel"]["image"]["url"]
        self.podcast_info.category = podcast_dict["rss"]["channel"]["itunes:category"][
            "@text"
        ]

        for episode in podcast_dict["rss"]["channel"]["item"]:
            episode_data = self.Episode()
            episode_data.title = episode["title"]
            episode_data.episode_num = int(episode["itunes:episode"])
            episode_data.pub_date = datetime.strptime(
                episode["pubDate"], "%a, %d %b %Y %H:%M:%S %z"
            )
            episode_data.summary = episode["description"]
            episode_data.url = episode["enclosure"]["@url"]
            episode_data.duration_seconds = float(episode["itunes:duration"])

            self.podcast_info.episodes.append(episode_data)


if __name__ == "__main__":
    feed = FeedReader("necronomipod", "https://feeds.megaphone.fm/necronomipod")
    feed.fetch_feed()
    feed.parse_feed()
