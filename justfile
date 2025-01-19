container := "pypodcast"
image := "pypodcast"

default:
    ./just --list

build:
    docker buildx build -t {{image}} -f py310.Dockerfile .

stop:
    if [ -n "$(docker container ps --all --filter 'name=pypodcast' --filter 'status=running' --quiet)" ]; then \
        docker stop "$(docker container ps --filter 'name=pypodcast' --all --format {{{{.ID}})"; \
        docker rm "$(docker container ps --filter 'name=pypodcast' --all --format {{{{.ID}})"; \
    fi

remove:
    if [ -n "$(docker container ps --all --filter 'name=pypodcast' --quiet)" ]; then \
        docker stop "$(docker container ps --filter 'name=pypodcast' --all --format {{{{.ID}})"; \
        docker rm "$(docker container ps --filter 'name=pypodcast' --all --format {{{{.ID}})"; \
    fi

run:
    docker run -d -it --name pypodcast pypodcast:latest

run-volume: stop remove
    xhost +local:root && \
    docker run -d -it \
    --name pypodcast \
    --gpus all \
    --privileged \
    --network=host \
    -v $(pwd):/pypodcast:rw \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -e NVIDIA_DRIVER_CAPABILITIES=all \
    -e NVIDIA_VISIBLE_DEVICES=all \
    -e DISPLAY=:0 \
    --runtime=nvidia \
    pypodcast:latest


exec-bash:
    docker exec -it pypodcast /bin/bash

exec-ui:
    FLASK_RUN_PORT=34567 python3 -m flask --app src.webui run --debug

run-debug: run-volume exec-bash
