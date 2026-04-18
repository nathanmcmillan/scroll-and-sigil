#!/bin/bash
set -euo pipefail
echo -n "!# "
basename "$0"

npx biome format public/src/*.js --write
