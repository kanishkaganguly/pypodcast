FROM python:3.10.14-bookworm
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Los_Angeles

RUN mkdir -p /pypodcast
WORKDIR /pypodcast
COPY . /pypodcast

RUN apt update && \
    DEBIAN_FRONTEND=noninteractive apt install -y \
    build-essential \
    pkg-config \
    python3-all-dev \
    chromium \
    pulseaudio pulseaudio-utils \
    python3-gi python3-gi-cairo gir1.2-gtk-3.0 gir1.2-webkit2-4.1 libgirepository1.0-dev && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    python3 -m pip install --upgrade pip && \
    python3 -m pip install \
    wheel \
    requests \
    xmltodict \
    waitress \
    flask \
    thefuzz \
    tqdm \
    flask-caching \
    flaskwebgui