from dataclasses import dataclass
from pathlib import Path


@dataclass
class Paths:
    cache: Path = Path("src/cache")
    metadata: Path = Path("src/cache/metadata.json")
    audio: Path = Path("src/static/audio")
    templates: Path = Path("src/templates")
