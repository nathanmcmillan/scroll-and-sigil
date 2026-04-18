#!/bin/bash
set -euo pipefail
echo -n "!# "
basename "$0"

npx biome lint --write
