#!/usr/bin/env bash

sudo docker run -p 15672:15672 -p 15674:15674 --name rabbitmq-server -d pusher-mobile/rabbitmq-server
