#!/bin/bash

if hash docker 2>/dev/null; then
    echo "docker is already installed";
else
    echo "#Installing docker"
    curl -sSL https://get.docker.com/ubuntu/ | sudo sh;
fi
#if hash docker-compose 2>/dev/null; then
#    echo "docker-compose is already installed";
#else
#    echo "#Installing docker-compose"
#    curl -L https://github.com/docker/compose/releases/download/1.1.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
#    chmod +x /usr/local/bin/docker-compose
#fi
