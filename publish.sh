#!/usr/bin/env bash
set -euo pipefail

dir='../scroll-and-sigil-website'

cp --archive public "$dir"
cd "$dir"

cp --archive public/index.html game.html
rm public/index.html

cp --archive public/* ./.

rm -r public
