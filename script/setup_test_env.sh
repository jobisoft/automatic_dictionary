#!/bin/bash

set -ex

sudo apt-get update
sudo apt-get install -y xvfb thunderbird unzip fluxbox
sudo apt-get install -y imagemagick libmagickwand-dev xvfb unzip imagemagick xdotool tesseract-ocr

if [ "$DEBUG" = true ]; then
    Xephyr -ac -screen 1280x960x24 :99 &
else
    Xvfb :99 -screen 0 1280x960x24 &
fi
export DISPLAY=:99
sleep 1
# Start window manager to focus window correctly.
fluxbox &
sleep 1

