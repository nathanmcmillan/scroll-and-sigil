#!/usr/bin/env bash
set -euo pipefail

temp='temp'

if [ -f "$temp" ]; then
  echo 'Temp file already exists'
  exit 1
fi

function cleanup {
  [ -f "$temp" ] && rm "$temp"
}
trap cleanup EXIT

mozilla='/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
'

shopt -s globstar
for file in public/src/**/*.js; do
  [[ "$file" = "public/src/external/"* ]] && continue
  header="$(head -n 1 "$file")"
  if [ "$header" != '/* This Source Code Form is subject to the terms of the Mozilla Public' ]; then
    echo "$file"
    echo "$mozilla" | cat - "$file" > "$temp"
    mv "$temp" "$file"
  fi
done
