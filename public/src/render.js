/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const LETTERS = 'abcdefghijklmnopqrstuvwxyz,;!?()+-.0123456789'

class Font {
  constructor(size, width, height) {
    this.name = name
    this.width = width
    this.height = height
    this.columns = Math.floor(size / width)
  }
}

export const FONT = new Font(64.0, 4, 6)

export function text(context, image, x, y, text, scale, font) {
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
    const index = LETTERS.indexOf(c)
    const left = Math.floor(index % font.columns) * font.width
    const top = Math.floor(index / font.columns) * font.height
    context.drawImage(image, left, top, font.width, font.height, currentX, currentY, fontWidth, fontHeight)
    currentX += fontWidth
  }
}
