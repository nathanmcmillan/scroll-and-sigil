/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { requestImage } from './net.js'

export const IMAGES = new Map()

function pixels(image) {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0)
  const data = context.getImageData(0, 0, image.width, image.height)
  const pixels = data.data
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] === 100 && pixels[i + 1] === 149 && pixels[i + 2] === 237) {
      pixels[i] = 0
      pixels[i + 1] = 0
      pixels[i + 2] = 0
      pixels[i + 3] = 0
    }
  }
  return { width: image.width, height: image.height, pixels: pixels }
}

export async function load(name, path) {
  const image = await requestImage(path)
  IMAGES.set(name, pixels(image))
}
