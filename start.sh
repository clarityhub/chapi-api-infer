#!/bin/bash

docker build ./fixtures/docker/local -t clarityhub-api-infer

docker run \
    -it \
    --rm \
    --publish 8020:8000 \
    --publish 4020:4000 \
    --network=clarityhub-network \
    --mount src="$(pwd)",target=/server,type=bind \
    --network-alias clarityhub-api-infer \
    --name clarityhub-api-infer \
    clarityhub-api-infer