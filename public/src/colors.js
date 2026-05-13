/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

function rgbc(red, green, blue) {
  return (red << 16) + (green << 8) + blue
}

export function red(rgb) {
  return (rgb >> 16) & 0xff
}

export function green(rgb) {
  return (rgb >> 8) & 0xff
}

export function blue(rgb) {
  return rgb & 0xff
}

export function hsb(hue, saturation, brightness) {
  return (hue << 10) + (saturation << 7) + brightness
}

function hue(hsb) {
  return (hsb >> 10) & 0x3f
}

function saturation(hsb) {
  return (hsb >> 7) & 0x07
}

function brightness(hsb) {
  return hsb & 0x7f
}

function conversion(p, q, t) {
  if (t < 0.0) t += 1.0
  if (t > 1.0) t -= 1.0
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t
  if (t < 1.0 / 2.0) return q
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0
  return p
}

export function rgb(hsb) {
  const hueC = hue(hsb) / 63.0
  const saturationC = saturation(hsb) / 7.0
  const brightnessC = brightness(hsb) / 127.0
  let r, g, b
  if (saturationC === 0.0) {
    r = g = b = Math.floor(brightnessC * 255.0 + 0.5)
  } else {
    const q =
      brightnessC < 0.5 ? brightnessC * (1.0 + saturationC) : brightnessC + saturationC - brightnessC * saturationC
    const p = 2.0 * brightnessC - q
    r = Math.floor(conversion(p, q, hueC + 1.0 / 3.0) * 255.0 + 0.5)
    g = Math.floor(conversion(p, q, hueC) * 255.0 + 0.5)
    b = Math.floor(conversion(p, q, hueC - 1.0 / 3.0) * 255.0 + 0.5)
  }
  return rgbc(r, g, b)
}

const _grass = rgb(hsb(16, 5, 30))
const _dirt = rgb(hsb(10, 4, 21))
const _lightDirt = rgb(hsb(10, 5, 23))
const _swamp = rgb(hsb(26, 4, 19))
const _road = rgb(hsb(0, 0, 63))
const skin = rgb(350)
const cuff = rgb(2130)
const belt = rgb(660)
const boots = rgb(400)
const pants = rgb(36133)
const shirt = rgb(21662)
const wood = rgbc(185, 122, 87)
const leaf = rgbc(34, 177, 36)

function _findColor(name) {
  switch (name) {
    case 'skin':
      return skin
    case 'cuff':
      return cuff
    case 'belt':
      return belt
    case 'boots':
      return boots
    case 'pants':
      return pants
    case 'shirt':
      return shirt
    case 'wood':
      return wood
    case 'leaf':
      return leaf
    default:
      return 0
  }
}
