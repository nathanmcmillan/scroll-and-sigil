/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export let CANVAS_WIDTH = 0
export let CANVAS_HEIGHT = 0
export let CANVAS_WIDTH_HALF = 0
export let CANVAS_HEIGHT_HALF = 0

export function setCanvasWidth(width) {
  CANVAS_WIDTH = width
  CANVAS_WIDTH_HALF = Math.floor(width / 2)
}

export function setCanvasHeight(height) {
  CANVAS_HEIGHT = height
  CANVAS_HEIGHT_HALF = Math.floor(height / 2)
}
