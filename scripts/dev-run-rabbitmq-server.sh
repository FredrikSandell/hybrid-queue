#!/usr/bin/env bash

sudo docker run -p 15672:15672 -p 15674:15674 -p 5672:5672 -v "${1}/logs:/data/log" --name rabbitmq-server -d pusher-mobile/rabbitmq-server
