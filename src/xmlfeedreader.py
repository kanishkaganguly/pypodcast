import requests as req
from requests.exceptions import StreamConsumedError
from dataclasses import dataclass, field
import xmltodict
from pathlib import Path
from typing import List, Tuple
from datetime import datetime, timedelta
import time
import json
from src.paths import Paths
from thefuzz import process as fzp
from tqdm import tqdm


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

    @classmethod
    def init_from_url(cls, feed_url: str) -> None:
        """
        Given a URL, this function will partially download a podcast feed (up to 500 bytes) and extract the feed name from the <title> tag.
        If the partial download is successful, the feed name will be extracted and used to create a new FeedReader object.
        If the partial download fails, an empty string is used as the feed name.
        :param feed_url: The URL of the podcast feed.
        :return: A new FeedReader object.
        """
        from xml.etree import ElementTree as et
        from io import BytesIO

        feed_name = ""

        range_upper = 102400  # bytes
        with req.session() as s:
            headers = {
                "Range": f"bytes=0-{range_upper}",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.101.76 Safari/537.36",
            }
            partial_data = s.get(feed_url, headers=headers)

        chunk_size = 2048  # bytes
        chunk_bytes = BytesIO()
        chunk = next(partial_data.iter_content(chunk_size=chunk_size))
        chunk_bytes.write(chunk)
        chunk_bytes.seek(0)

        ctx = et.iterparse(chunk_bytes)
        try:
            for _, element in ctx:
                if element.tag == "title":
                    feed_name = element.text.lower().replace(" ", "_")
                    print(f"Feed Name: {feed_name}, Feed URL: {feed_url}")
                    return cls(feed_name, feed_url)
        except et.ParseError as e:
            print(f"{e} Unable to parse XML")

        return None

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
        """
        Find an episode by its episode number.

        Args:
            episode_num (int): The episode number to search for.

        Returns:
            Tuple[bool, None | Episode]: A tuple where the first element is a boolean
            indicating if the episode was found, and the second element is the Episode
            object if found, otherwise None.
        """

        for episode in self.podcast_info.episodes:
            if episode.episode_num == episode_num:
                return (True, episode)  # Found
        return (False, None)

    def fetch_feed(self) -> None:
        """
        Downloads the podcast feed and updates the metadata if it is older than 24 hours or if update_now is True.
        """

        def download_feed(feed_url: str, feed_name: str) -> None:
            print("Downloading feed")
            pod_xml = req.get(feed_url).text
            with open(f"{Paths.cache}/{feed_name}.xml", "w") as f:
                f.write(pod_xml)

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
        # If exists in database
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
                download_feed(self.feed_url, self.feed_name)
                data["feed_last_update"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            else:
                # Keep last update timestamp if not updated
                data["feed_last_update"] = last_update.strftime("%Y-%m-%d %H:%M:%S")
                print("Using cached feed")
        else:
            # If not exists in database
            download_feed(self.feed_url, self.feed_name)
            data["feed_url"] = self.feed_url
            data["feed_last_update"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Update metadata
        with open(pod_metadata_path, "w") as f:
            metadata[self.feed_name] = data
            json.dump(metadata, f)

    def parse_feed(self) -> None:
        """
        Parse the downloaded feed XML and populate the FeedReader.Podcast object's
        attributes with the parsed data. The parsed data includes the podcast's title,
        link, image, owner, description, and episodes.

        The XML is parsed using the xmltodict library, which converts the XML into a
        nested dictionary. The dictionary is then traversed to extract the required
        information.

        The episode information is stored in a list of Episode objects, which contain
        the episode title, episode number, publication date, summary, URL, and duration
        in seconds. The duration is parsed from the itunes:duration attribute, which
        can be given in HH:MM:SS format or directly as seconds.
        """
        root = None
        with open(f"{Paths.cache}/{self.feed_name}.xml", "r") as f:
            root = f.read()

        # Handle multiple categories edge-case
        podcast_dict = xmltodict.parse(
            root, xml_attribs=True, force_list="itunes:category"
        )

        # Title
        self.podcast_info.title = (
            podcast_dict["rss"]["channel"]["title"]
            if "title" in podcast_dict["rss"]["channel"]
            else ""
        )
        # Link
        self.podcast_info.link = (
            podcast_dict["rss"]["channel"]["link"]
            if "link" in podcast_dict["rss"]["channel"]
            else ""
        )
        # Image
        self.podcast_info.image = (
            podcast_dict["rss"]["channel"]["image"]["url"]
            if "image" in podcast_dict["rss"]["channel"]
            and "url" in podcast_dict["rss"]["channel"]["image"]
            else "https://placehold.co/640x640/orange/white?text=Podcast+Image"
        )
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
            episode_data.episode_num = (
                int(episode["itunes:episode"])
                if "itunes:episode" in episode.keys()
                else -1
            )
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
    # new_feed1 = FeedReader.init_from_url("https://feeds.megaphone.fm/necronomipod.xml")

    new_feed2: FeedReader = FeedReader.init_from_url(
        "https://omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/E5F91208-CC7E-4726-A312-AE280140AD11/D64F756D-6D5E-4FAE-B24F-AE280140AD36/podcast.rss"
    )
    new_feed2.fetch_feed()
    new_feed2.parse_feed()

    # new_feed3 = FeedReader.init_from_url("https://feeds.simplecast.com/dCXMIpJz")

#     feed = FeedReader("necronomipod", "https://feeds.megaphone.fm/necronomipod")
#     feed.fetch_feed()
#     feed.parse_feed()

#     feed2 = FeedReader(
#         "last_podcast_on_the_left", "https://feeds.simplecast.com/dCXMIpJz"
#     )
#     feed2.fetch_feed()
#     feed2.parse_feed()

#     print(FeedReader.get_podcast_name_from_metadata("necronomipod"))
#     print(FeedReader.get_podcast_name_from_metadata("last podcast"))
