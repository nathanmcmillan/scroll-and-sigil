#!/bin/bash
set -euo pipefail
echo -n "!# "
basename "$0"

directory='../scroll-and-sigil-website'

cp --archive public "$directory"
cd "$directory"

cp --archive public/index.html game.html
rm public/index.html

cp --archive public/* ./.

rm -r public
