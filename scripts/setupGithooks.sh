#!/bin/sh

git config --local core.hooksPath .githooks

echo "Hooks location is now: $(git config --get core.hooksPath)"