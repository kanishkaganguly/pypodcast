
# Podcast Player

A very simple browser-based podcast player made with Flask/Bulma/jQuery.
Playback is handled by the excellent [Howler.js](https://github.com/goldfire/howler.js) audio library.

I made this as a side project, since there appears to be no free desktop app for playing podcasts on Linux that I liked. PocketCasts has a web option, but that is only for premium users.

Also, I wanted to learn Bulma.
## Run Locally

Clone the project

```bash
  git clone https://link-to-project
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
- [ ]  Queue management
- [ ]  Adding new podcasts from RSS feed
- [ ]  Proper release mechanism
- [ ]  `LocalStorage` or something for playback save/resume.