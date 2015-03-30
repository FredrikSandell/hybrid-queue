#!/usr/bin/env bash
sudo docker run -p 9000:9000 -v "${1}:/static-server" --name static-server --link rabbitmq-server:rabbitmq-server -d pusher-mobile/static-server bash static-server/runDev.sh
