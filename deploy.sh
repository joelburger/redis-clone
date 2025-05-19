#!/bin/bash -e

version=$1

if [ -z "$version" ]; then
    echo "Error: Version argument is required."
    echo "Usage: ./deploy.sh <version>"
    exit 1
fi

gcloud auth application-default login

echo "Deployment started for project version: $version"

echo "$version" > version.txt

echo "Building project"

docker build -t redis-server:$version .

docker tag redis-server:$version asia.gcr.io/skunkworks-268706/redis-server:$version

docker push asia.gcr.io/skunkworks-268706/redis-server:$version

