from enum import IntEnum


class ControlType(IntEnum):
    PLAY = 1
    PAUSE = 2
    NEXT = 3
    PREV = 4


def _play():
    print("Play")


def _pause():
    print("Pause")


def _next():
    print("Next")


def _prev():
    print("Prev")


def _set_volume(vol: int):
    print(f"Set volume: {vol}")


def _set_seek_seconds(seek: int):
    print(f"Set seek: {seek}")
