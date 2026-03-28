/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { requestImage } from './net.js'

export const IMAGES = new Map()
export const IMAGE_PIXELS = new Map()

export async function load(name, path) {
  const image = await requestImage(path)
  IMAGES.set(name, image)
  IMAGE_PIXELS.set(name, pixels(image))
}

export async function loadAndSwap(name, path) {
  const image = await requestImage(path)
  swap(image)
  IMAGES.set(name, image)
}

function swap(image) {
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
    if (pixels[i] >= 246 && pixels[i + 1] <= 69 && pixels[i + 2] >= 246) {
      pixels[i] = 0
      pixels[i + 1] = 0
      pixels[i + 2] = 0
      pixels[i + 3] = 0
    }
  }
  return pixels
}
