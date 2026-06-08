#!/bin/sh

MODELS_URL="https://www.dropbox.com/scl/fo/26caq1lsul7xdj1sbnngc/AEMC4ejorOiVWlTGM6bFc5k?rlkey=uzaoykix8c5p917vx5v1m7e4e&st=erxnedqc&dl=1"
if [ -z "$MODELS_URL" ]; then
	echo "MODELS_URL not defined"
	exit 1
fi

mkdir -p public/models
TMP_ZIP=$(mktemp --suffix=.zip)
echo "Downloading models..."
curl -L "$MODELS_URL" -o "$TMP_ZIP"
echo "Extracting..."
unzip -o "$TMP_ZIP" -d public/models
rm "$TMP_ZIP"
echo "Done."