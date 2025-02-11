
# Podcast Player

A very simple browser-based podcast player made with Flask/Bulma/jQuery.
Playback is handled by the excellent [Howler.js](https://github.com/goldfire/howler.js) audio library.

I made this as a side project, since there appears to be no free desktop app for playing podcasts on Linux that I liked. PocketCasts has a web option, but that is only for premium users.

Also, I wanted to learn Bulma.

![Player v1](https://github.com/kanishkaganguly/pypodcast/blob/master/player.png?raw=true)
![Player Dark Mode with Advanced Menu](https://github.com/kanishkaganguly/pypodcast/blob/master/player_dark_menu.png?raw=true)
![Player GUI Mode with Advanced Menu](https://github.com/kanishkaganguly/pypodcast/blob/master/player_gui.png?raw=true)
![Sleep timer](https://github.com/kanishkaganguly/pypodcast/blob/master/sleep_timer.png?raw=true)

## Run

### Use the app
- Grab the `compose.yml` file from the repository
- Run `UID=${UID} docker compose up`

### Development
Clone the project

```bash
  git clone https://github.com/kanishkaganguly/pypodcast
```

Dependencies
- Docker

Go to the project directory

```bash
  cd pypodcast
```

Run `justfile`

```bash
  ./just run-debug
```

Start the server (inside docker shell)

```bash
  ./just exec-ui
```


## Tech Stack

**Client:** [BulmaCSS](https://bulma.io/), [jQuery](https://jquery.com/), [HowlerJS](https://github.com/goldfire/howler.js)

**Server:** [Flask](https://flask.palletsprojects.com/en/stable/), [Flask-Caching](https://flask-caching.readthedocs.io/en/latest/)


## Roadmap

- [x] Basic interface and functionality
    - [x]  Loading podcasts from RSS feed URL
    - [x]  Iterating over podcasts and lists, with all details
    - [x]  Play/Pause, Seek, Volume
    - [x]  Time-based caching and refresh for metadata
- [x]  Adding new podcasts from RSS feed
- [x]  Menu for advanced playback controls (speed, sleep timer, audio source select)
    - [x]  Make dropdown menu
    - [x]  Add controls for playback speed
    - [x]  PulseAudio forwarding, audio source selector inside menu
    - [x]  Sleep timer
- [x] [flaskwebgui](https://github.com/ClimenteA/flaskwebgui) for proper app mode
- [ ] Queue management
- [x]  Proper release mechanism
    - [x] DockerHub CI/CD with `compose.yml` launcher
    - [ ] `flaskwebgui` should allow for `pyinstaller`-based mechanisms (`wontfix`)
- [ ]  `LocalStorage` or something for playback save/resume.
