#!/bin/bash

set -ex
source script/setup_test_env.sh
# load profile for rbenv to work
source ~/.bash_profile
export DEBUG=1

# Set log level to debug
sed -i 's/\s*"logLevel":.*/"logLevel":"debug",/g' addon/ad.js

rm -rf test/tmp/*
cd test/integration/
bundle exec rspec spec/automatic_dictionary
bundle exec rspec spec/lib
