/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { requestImage } from './net.js'

// const TRANSPARENCY = 0xff00ff

export const IMAGES = new Map()

export async function load(name, path) {
  const image = await requestImage(path)
  IMAGES.set(name, image)
}

export async function loadAndSwap(name, path) {
  const image = await requestImage(path)
  swap(image)
  IMAGES.set(name, image)
}

export function swap(image) {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0)
  const data = context.getImageData(0, 0, image.width, image.height)
  const pixels = data.data
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] >= 246 && pixels[i + 1] <= 69 && pixels[i + 2] >= 246) {
      pixels[i] = 0
      pixels[i + 1] = 0
      pixels[i + 2] = 0
      pixels[i + 3] = 0
    }
  }
  context.putImageData(data, 0, 0)
  image.src = canvas.toDataURL('image/png')
}

export function pixelate(image, scale) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = image.width
  canvas.height = image.height
  console.log('image ' + canvas.width + ', ' + canvas.height)
  context.drawImage(image, 0, 0)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data

  const canvas2 = document.createElement('canvas')
  const context2 = canvas2.getContext('2d')
  canvas2.width = image.width * scale
  canvas2.height = image.height * scale

  const buffer2 = context2.getImageData(0, 0, canvas2.width, canvas2.height)
  const pixels2 = buffer2.data

  for (let x = 0; x < canvas2.width; x++) {
    for (let y = 0; y < canvas2.height; y++) {
      const i = (Math.floor(x / scale) + Math.floor(y / scale) * canvas.width) * 4
      const i2 = (x + y * canvas2.width) * 4
      pixels2[i2] = pixels[i]
      pixels2[i2 + 1] = pixels[i + 1]
      pixels2[i2 + 2] = pixels[i + 2]
      pixels2[i2 + 3] = pixels[i + 3]
    }
  }
  context2.putImageData(buffer2, 0, 0)
  const source = canvas2.toDataURL('image/png')
  image.src = source
}
