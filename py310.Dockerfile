FROM python:3.10.14-bookworm
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Los_Angeles

SHELL [ "/bin/bash", "-c" ]

# Set the working directory
RUN mkdir -p /pypodcast
WORKDIR /pypodcast
# Copy the current directory contents into the container at /pypodcast
COPY ./src /pypodcast/src
COPY ./entrypoint.sh /pypodcast/entrypoint.sh
COPY ./just /pypodcast/just
COPY ./justfile /pypodcast/justfile

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

RUN mv /pypodcast/entrypoint.sh /entrypoint.sh && \
    chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]