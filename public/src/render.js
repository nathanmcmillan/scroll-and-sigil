/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const FONT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

class Font {
  constructor(name, width, height, base) {
    this.name = name
    this.width = width
    this.height = height
    this.base = base
    this.grid = Math.floor(128.0 / width)
    this.column = width / 128.0
    this.row = height / 128.0
  }
}

export const TIC_FONT_WIDTH = 6
export const TIC_FONT_HEIGHT = 6
export const TIC_FONT_HEIGHT_BASE = 5

export const TIC_FONT = new Font('tic-80-wide-font', 6, 6, 5)
export const WIN_FONT = new Font('win-9-font', 8, 15, 14)
export const EGA_FONT = new Font('ega-8-font', 9, 8, 8)
export const VGA_FONT = new Font('vga-437-font', 9, 16, 15)
export const DINA_FONT = new Font('dina-10-font', 8, 16, 15)
export const SUPER_FONT = new Font('super-font', 8, 9, 8)
export const SUPER_OUTLINE_FONT = new Font('super-outline-font', 8, 8, 8)
export const SUPER_TITLE_FONT = new Font('super-title-font', 8, 16, 15)

export function drawTextFont(context, x, y, text, scale, red, green, blue, alpha, font) {
  let currentX = x
  let currentY = y
  const fontWidth = font.width * scale
  const fontHeight = font.height * scale
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i)
    if (c === ' ') {
      currentX += fontWidth
      continue
    } else if (c === '\n') {
      currentX = x
      currentY += fontHeight
      continue
    }
    const index = FONT.indexOf(c)
    const left = Math.floor(index % font.grid) * font.column
    const top = Math.floor(index / font.grid) * font.row
    const right = left + font.column
    const bottom = top + font.row
    context.drawImage(currentX, currentY, fontWidth, fontHeight, red, green, blue, alpha, left, top, right, bottom)
    currentX += fontWidth
  }
}
