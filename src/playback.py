from src.xmlfeedreader import FeedReader
import requests as req
import io
from tqdm import tqdm
import pyaudio
from pathlib import Path
from src.paths import Paths


class Playback:
    def __init__(self, feed_name: str, episode_num: int) -> None:
        self.feed_name: str = feed_name
        self.episode_num: int = episode_num
        self.episode: FeedReader.Episode = None
        self.paudio = pyaudio.PyAudio()

    def load_episode(self) -> bool:
        res, get_name, get_metadata = FeedReader.get_podcast_name_from_metadata(
            self.feed_name
        )
        if res:
            self.feed_name = get_name
            self.feed_url = get_metadata["feed_url"]
        else:
            self.feed_name = ""
            self.feed_url = ""
            raise ValueError(f"Unable to find podcast {self.feed_name} in metadata")

        print(f"Loading episode {self.episode_num} from {self.feed_name}")
        print(f"Feed Name: {self.feed_name} Feed URL: {self.feed_url}")

        self.feed = FeedReader(self.feed_name, self.feed_url)
        self.feed.fetch_feed()
        self.feed.parse_feed()

        res, episode = self.feed.find_episode(self.episode_num)
        if res:
            self.episode = episode

        print(f"Episode:{self.episode.title}\nEpisode URL: {self.episode.url}")

        return True

    def fetch_audio(self) -> bool:
        print("Fetching audio")

        # Fetch audio
        audio_data = req.get(self.episode.url, stream=True)

        # Sizes in bytes.
        total_size = int(audio_data.headers.get("content-length", 0))
        block_size = 1024

        audio_path = Path(f"{Paths.audio}/{self.feed_name}-{self.episode_num}.mp3")
        # Check if file exists
        if not Path(audio_path).exists():
            # Load data and show progress bar
            with tqdm(total=total_size, unit="B", unit_scale=True) as bar:
                for data in audio_data.iter_content(block_size):
                    bar.update(len(data))
                    audio_mp3 = io.BytesIO(audio_data.content)
            print("Audio fetched")

            # Write to file
            with open(audio_path, "wb") as f:
                f.write(audio_mp3.getbuffer())

        print("Finished fetching audio")
        return True


if __name__ == "__main__":
    playback = Playback("necronomipod", 360)
    playback.load_episode()
    playback.fetch_audio()
