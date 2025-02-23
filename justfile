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

run: stop remove
    xhost +local:root && \
    docker run -d -it \
    --name pypodcast \
    --gpus all \
    --privileged \
    --network=host \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -e NVIDIA_DRIVER_CAPABILITIES=all \
    -e NVIDIA_VISIBLE_DEVICES=all \
    -e DISPLAY=:0 \
    -e PULSE_SERVER=unix:/run/user/$(id -u)/pulse/native \
    -e PULSE_COOKIE=${XDG_RUNTIME_DIR}/pulse/cookie \
    -v /run/user/$(id -u)/pulse:/run/user/$(id -u)/pulse \
    -v /run/user/$(id -u)/pulse/native:/run/user/$(id -u)/pulse/native \
    --device=/dev/snd:/dev/snd \
    pypodcast:latest

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
    -e PULSE_SERVER=unix:/run/user/$(id -u)/pulse/native \
    -e PULSE_COOKIE=${XDG_RUNTIME_DIR}/pulse/cookie \
    -v /run/user/$(id -u)/pulse:/run/user/$(id -u)/pulse \
    -v /run/user/$(id -u)/pulse/native:/run/user/$(id -u)/pulse/native \
    --device=/dev/snd:/dev/snd \
    --entrypoint "/bin/bash" \
    pypodcast:latest

exec-bash:
    docker exec -it pypodcast /bin/bash

ui-dev:
    DISPLAY=:0 FLASK_RUN_PORT=34567 python3 -m src.webui --debug

ui-app:
    DISPLAY=:0 FLASK_RUN_PORT=34567 python3 -m src.webui

run-dev: run-volume exec-bash
