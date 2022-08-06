#!/usr/bin/env bash
set -euo pipefail

node_modules/.bin/eslint --fix public/src/*.js
node_modules/.bin/eslint --fix public/src/**/*.js
