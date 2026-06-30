#!/bin/bash

set -e

if [ $# -ne 2 ]; then
    echo "Usage: $0 <image file> <level number>"
    exit 1
fi

img="$1"
levelNum="$2"

if [ ! -f "$img" ]; then
    echo "The provided image file '$img' does not exist."
    exit 1
fi

if ! [[ "$levelNum" =~ ^[1-9][0-9]*$ ]]; then
    echo "The level number must be a positive integer."
    exit 1
fi

# Get image dimensions
width=$(magick identify -format "%w" "$img")
height=$(magick identify -format "%h" "$img")

base="${img%.*}"
ext="${img##*.}"

for ((i=1; i<=levelNum; i++)); do
    width=$((width / 2))
    height=$((height / 2))

    output="${base}_${width}x${height}.${ext}"
    magick "$img" -resize "${width}x${height}" "$output"
    echo "Created $output"
done