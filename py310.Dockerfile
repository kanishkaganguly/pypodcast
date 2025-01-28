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
    portaudio19-dev \
    python3-all-dev && \
    apt clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    python3 -m pip install --upgrade pip && \
    python3 -m pip install wheel requests xmltodict flask thefuzz pyaudio tqdm
