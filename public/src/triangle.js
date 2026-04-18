/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH_HALF, CANVAS_HEIGHT_HALF } from './canvas.js'

export function pixel2d(pixels, x, y, r, g, b) {
  if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) return
  const i = (x + y * CANVAS_WIDTH) * 4
  pixels[i] = r
  pixels[i + 1] = g
  pixels[i + 2] = b
}

export function line2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2) {
  const dx = x2 - x1
  const dy = y2 - y1

  if (dx === 0 && dy === 0) {
    pixel2d(pixels, x1, y1, r1, g1, b1)
    return
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    let xs, xb
    if (x1 < x2) {
      xs = x1
      xb = x2
    } else {
      xs = x2
      xb = x1
    }
    const slope = dy / dx
    for (let x = xs; x <= xb; x++) {
      const y = y1 + (x - x1) * slope
      const c = (x - x1) / dx
      const r = r1 + (r2 - r1) * c
      const g = g1 + (g2 - g1) * c
      const b = b1 + (b2 - b1) * c
      pixel2d(pixels, Math.round(x), Math.round(y), Math.round(r), Math.round(g), Math.round(b))
    }
  } else {
    let ys, yb
    if (y1 < y2) {
      ys = y1
      yb = y2
    } else {
      ys = y2
      yb = y1
    }
    const slope = dx / dy
    for (let y = ys; y <= yb; y++) {
      const x = x1 + (y - y1) * slope
      const c = (y - y1) / dy
      const r = r1 + (r2 - r1) * c
      const g = g1 + (g2 - g1) * c
      const b = b1 + (b2 - b1) * c
      pixel2d(pixels, Math.round(x), Math.round(y), Math.round(r), Math.round(g), Math.round(b))
    }
  }
}

function span2d(pixels, x1, r1, g1, b1, x2, r2, g2, b2, line) {
  const dx = x2 - x1
  if (dx === 0) return

  const dr = r2 - r1
  const dg = g2 - g1
  const db = b2 - b1

  let factor = 0.0
  const step = 1.0 / dx

  let index = Math.round(x1)
  if (index < 0) {
    factor = -index * step
    index = line * 4
  } else {
    index = (index + line) * 4
  }

  const end = x2 > CANVAS_WIDTH ? (CANVAS_WIDTH + line) * 4 : (Math.ceil(x2) + line) * 4

  while (index < end) {
    const r = r1 + Math.round(dr * factor)
    const g = g1 + Math.round(dg * factor)
    const b = b1 + Math.round(db * factor)

    pixels[index] = r
    pixels[index + 1] = g
    pixels[index + 2] = b

    index += 4

    factor += step
  }
}

function between2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3, x4, y4, r4, g4, b4) {
  const e1dy = y2 - y1
  if (e1dy === 0) return

  const e2dy = y4 - y3
  if (e2dy === 0) return

  const e1dx = x2 - x1
  const e2dx = x4 - x3

  const e1dr = r2 - r1
  const e1dg = g2 - g1
  const e1db = b2 - b1

  const e2dr = r4 - r3
  const e2dg = g4 - g3
  const e2db = b4 - b3

  let factor1 = (y3 - y1) / e1dy
  let factor2 = 0.0

  const step1 = 1.0 / e1dy
  const step2 = 1.0 / e2dy

  let line = Math.round(y3)
  if (line < 0) {
    factor1 += -line * step1
    factor2 = -line * step2
    line = 0
  } else {
    line *= CANVAS_WIDTH
  }

  const end = y4 > CANVAS_HEIGHT ? CANVAS_HEIGHT * CANVAS_WIDTH : Math.ceil(y4) * CANVAS_WIDTH

  while (line < end) {
    const sr1 = r1 + e1dr * factor1
    const sg1 = g1 + e1dg * factor1
    const sb1 = b1 + e1db * factor1

    const sr2 = r3 + e2dr * factor2
    const sg2 = g3 + e2dg * factor2
    const sb2 = b3 + e2db * factor2

    const sx1 = x1 + e1dx * factor1
    const sx2 = x3 + e2dx * factor2

    if (sx1 < sx2) {
      span2d(pixels, sx1, sr1, sg1, sb1, sx2, sr2, sg2, sb2, line)
    } else {
      span2d(pixels, sx2, sr2, sg2, sb2, sx1, sr1, sg1, sb1, line)
    }

    factor1 += step1
    factor2 += step2

    line += CANVAS_WIDTH
  }
}

export function triangle2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3) {
  const edge1 = y1 < y2
  const edge2 = y2 < y3
  const edge3 = y3 < y1
  let longest = edge1 ? y2 - y1 : y1 - y2
  let zero = true
  let length = edge2 ? y3 - y2 : y2 - y3
  if (length > longest) {
    longest = length
    zero = false
  }
  length = edge3 ? y1 - y3 : y3 - y1
  if (length > longest) {
    if (edge3) {
      if (edge1) {
        between2d(pixels, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2)
      } else {
        between2d(pixels, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1)
      }
      if (edge2) {
        between2d(pixels, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3)
      } else {
        between2d(pixels, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2)
      }
    } else {
      if (edge1) {
        between2d(pixels, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2)
      } else {
        between2d(pixels, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1)
      }
      if (edge2) {
        between2d(pixels, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3)
      } else {
        between2d(pixels, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2)
      }
    }
  } else if (zero) {
    if (edge1) {
      if (edge2) {
        between2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3)
      } else {
        between2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2)
      }
      if (edge3) {
        between2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1)
      } else {
        between2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3)
      }
    } else {
      if (edge2) {
        between2d(pixels, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3)
      } else {
        between2d(pixels, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2)
      }
      if (edge3) {
        between2d(pixels, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1)
      } else {
        between2d(pixels, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3)
      }
    }
  } else {
    if (edge2) {
      if (edge3) {
        between2d(pixels, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1)
      } else {
        between2d(pixels, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3)
      }
      if (edge1) {
        between2d(pixels, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2)
      } else {
        between2d(pixels, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1)
      }
    } else {
      if (edge3) {
        between2d(pixels, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3, x1, y1, r1, g1, b1)
      } else {
        between2d(pixels, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1, x3, y3, r3, g3, b3)
      }
      if (edge1) {
        between2d(pixels, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2)
      } else {
        between2d(pixels, x3, y3, r3, g3, b3, x2, y2, r2, g2, b2, x2, y2, r2, g2, b2, x1, y1, r1, g1, b1)
      }
    }
  }
}
