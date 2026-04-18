/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH_HALF, CANVAS_HEIGHT_HALF } from './canvas.js'

export const SHIFT = 16
const SHIFT_UNIT = 1 << SHIFT
const _SHIFT_MASK = SHIFT_UNIT - 1

const SHIFT_BIG = 16n
const _SHIFT_UNIT_BIG = 1n << SHIFT_BIG

function _fixedAdd(a, b) {
  return a + b
}

function _fixedMul(a, b) {
  return (a * b) >> SHIFT
}

function _fixedDiv(a, b) {
  return (a / b) * SHIFT_UNIT
}

function fixedToFloat(f) {
  return f / SHIFT_UNIT
}

function _floatToFixed(f) {
  return Math.round(f * SHIFT_UNIT)
}

export function mode2d(pixels, image, x1, y1, x2, y2, x3, y3, x4, y4, sl, st, sr, sb) {
  texture2d(pixels, image, x1, y1, sl, st, x2, y2, sr, st, x3, y3, sl, sb)
  texture2d(pixels, image, x3, y3, sl, sb, x2, y2, sr, st, x4, y4, sr, sb)
}

export function sprite2d(pixels, x, y, image, sx, sy, sw, sh) {
  const iw = image.width
  const src = image.pixels
  let s = y * CANVAS_WIDTH
  let f = sy * iw
  for (let r = 0; r < sh; r++) {
    for (let c = 0; c < sw; c++) {
      const p = (sx + c + f) * 4
      const i = (x + c + s) * 4
      pixels[i] = src[p]
      pixels[i + 1] = src[p + 1]
      pixels[i + 2] = src[p + 2]
    }
    f += iw
    s += CANVAS_WIDTH
  }
}

function texspan2d(pixels, image, x1, u1, v1, x2, u2, v2, line) {
  // if (x2 > CANVAS_WIDTH) x2 = CANVAS_WIDTH

  const dx = x2 - x1
  if (dx === 0) return

  const du = u2 - u1
  const dv = v2 - v1

  // let factor = 0.0
  // const step = 1.0 / dx

  let factorf = 0
  const stepf = Math.floor((SHIFT_UNIT / dx) * SHIFT_UNIT)

  const src = image.pixels
  const wide = image.width

  // let x = Math.round(x1)
  // if (x < 0) {
  //   factor += -x * step
  //   x = 0
  // }

  let x = Math.round(fixedToFloat(x1))
  x2 = Math.round(fixedToFloat(x2))

  for (; x < x2; x++) {
    // const u = u1 + du * factor
    // const v = v1 + dv * factor

    // const t = (Math.round(u) + Math.round(v) * wide) * 4

    const utexel = Math.floor((SHIFT_UNIT / (16 << SHIFT)) * SHIFT_UNIT)
    const vtexel = Math.floor((SHIFT_UNIT / (24 << SHIFT)) * SHIFT_UNIT)

    const u = u1 + Number((BigInt(du) * BigInt(factorf)) >> SHIFT_BIG) - utexel
    const v = v1 + Number((BigInt(dv) * BigInt(factorf)) >> SHIFT_BIG) - vtexel

    // 122
    // ----> 231 	 15 	 15.27099609375

    // 127
    // ----> 227 	 14 	 13.604736328125
    // ----> 228 	 14 	 14.104690551757812
    // ----> 229 	 15 	 14.604660034179688
    // ----> 230 	 15 	 15.104629516601562
    // ----> 231 	 16 	 15.604598999023438

    // if (Math.round(line / CANVAS_WIDTH) === 127) {
    if (x === 231) {
      // console.log('---->', cu, cv, '|', u1, u2, '|', v1, v2, '|', du, dv, '*', factor, '(', step, ')')
      // console.log('---->', x, '\t', Math.round(fixedToFloat(u)), '\t', fixedToFloat(u))
    }

    const t = (Math.round(fixedToFloat(u)) + Math.round(fixedToFloat(v)) * wide) * 4

    const r = src[t]
    const g = src[t + 1]
    const b = src[t + 2]

    const i = (x + line) * 4

    pixels[i] = r
    pixels[i + 1] = g
    pixels[i + 2] = b

    // factor += step
    factorf += stepf
  }
}

function texbetween2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3, x4, y4, u4, v4) {
  const e1dy = y2 - y1
  if (e1dy === 0) return

  const e2dy = y4 - y3
  if (e2dy === 0) return

  // const e1dx = x2 - x1
  // const e2dx = x4 - x3

  const e1dx = (x2 - x1) << SHIFT
  const e2dx = (x4 - x3) << SHIFT

  const e1du = u2 - u1
  const e1dv = v2 - v1

  const e2du = u4 - u3
  const e2dv = v4 - v3

  let _factor1 = (y3 - y1) / e1dy
  let _factor2 = 0.0

  const step1 = 1.0 / e1dy
  const step2 = 1.0 / e2dy

  let factor1f = Math.floor((((y3 - y1) << SHIFT) / (e1dy << SHIFT)) * SHIFT_UNIT)
  let factor2f = 0

  const step1f = Math.floor((SHIFT_UNIT / (e1dy << SHIFT)) * SHIFT_UNIT)
  const step2f = Math.floor((SHIFT_UNIT / (e2dy << SHIFT)) * SHIFT_UNIT)

  let y = Math.round(y3)
  if (y < 0) {
    _factor1 += -y * step1
    _factor2 += -y * step2
    y = 0
  }

  let f = Math.ceil(y4)
  if (f > CANVAS_HEIGHT) f = CANVAS_HEIGHT

  const end = f * CANVAS_WIDTH

  let line = y * CANVAS_WIDTH

  x1 <<= SHIFT
  x3 <<= SHIFT

  while (line < end) {
    const su1 = u1 + Number((BigInt(e1du) * BigInt(factor1f)) >> SHIFT_BIG)
    const sv1 = v1 + Number((BigInt(e1dv) * BigInt(factor1f)) >> SHIFT_BIG)

    const su2 = u3 + Number((BigInt(e2du) * BigInt(factor2f)) >> SHIFT_BIG)
    const sv2 = v3 + Number((BigInt(e2dv) * BigInt(factor2f)) >> SHIFT_BIG)

    const sx1 = x1 + Number((BigInt(e1dx) * BigInt(factor1f)) >> SHIFT_BIG)
    const sx2 = x3 + Number((BigInt(e2dx) * BigInt(factor2f)) >> SHIFT_BIG)

    // const su1 = u1 + e1du * factor1
    // const sv1 = v1 + e1dv * factor1

    // const su2 = u3 + e2du * factor2
    // const sv2 = v3 + e2dv * factor2

    // const sx1 = x1 + e1dx * factor1
    // const sx2 = x3 + e2dx * factor2

    if (sx1 < sx2) {
      texspan2d(pixels, image, sx1, su1, sv1, sx2, su2, sv2, line)
    } else {
      if (line < (y + 20) * CANVAS_WIDTH) {
        // console.log(fixedToFloat(sx1), fixedToFloat(sx2), '|', 'u1:', fixedToFloat(u1), 'u2:', fixedToFloat(u2))
      }
      texspan2d(pixels, image, sx2, su2, sv2, sx1, su1, sv1, line)
    }

    _factor1 += step1
    _factor2 += step2

    factor1f += step1f
    factor2f += step2f

    line += CANVAS_WIDTH
  }
}

export function texture2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3) {
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
        texbetween2d(pixels, image, x3, y3, u3, v3, x1, y1, u1, v1, x1, y1, u1, v1, x2, y2, u2, v2)
      } else {
        texbetween2d(pixels, image, x3, y3, u3, v3, x1, y1, u1, v1, x2, y2, u2, v2, x1, y1, u1, v1)
      }
      if (edge2) {
        texbetween2d(pixels, image, x3, y3, u3, v3, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3)
      } else {
        texbetween2d(pixels, image, x3, y3, u3, v3, x1, y1, u1, v1, x3, y3, u3, v3, x2, y2, u2, v2)
      }
    } else {
      if (edge1) {
        texbetween2d(pixels, image, x1, y1, u1, v1, x3, y3, u3, v3, x1, y1, u1, v1, x2, y2, u2, v2)
      } else {
        texbetween2d(pixels, image, x1, y1, u1, v1, x3, y3, u3, v3, x2, y2, u2, v2, x1, y1, u1, v1)
      }
      if (edge2) {
        texbetween2d(pixels, image, x1, y1, u1, v1, x3, y3, u3, v3, x2, y2, u2, v2, x3, y3, u3, v3)
      } else {
        texbetween2d(pixels, image, x1, y1, u1, v1, x3, y3, u3, v3, x3, y3, u3, v3, x2, y2, u2, v2)
      }
    }
  } else if (zero) {
    if (edge1) {
      if (edge2) {
        texbetween2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x2, y2, u2, v2, x3, y3, u3, v3)
      } else {
        texbetween2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3, x2, y2, u2, v2)
      }
      if (edge3) {
        texbetween2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3, x1, y1, u1, v1)
      } else {
        texbetween2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x1, y1, u1, v1, x3, y3, u3, v3)
      }
    } else {
      if (edge2) {
        texbetween2d(pixels, image, x2, y2, u2, v2, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3)
      } else {
        texbetween2d(pixels, image, x2, y2, u2, v2, x1, y1, u1, v1, x3, y3, u3, v3, x2, y2, u2, v2)
      }
      if (edge3) {
        texbetween2d(pixels, image, x2, y2, u2, v2, x1, y1, u1, v1, x3, y3, u3, v3, x1, y1, u1, v1)
      } else {
        texbetween2d(pixels, image, x2, y2, u2, v2, x1, y1, u1, v1, x1, y1, u1, v1, x3, y3, u3, v3)
      }
    }
  } else {
    if (edge2) {
      if (edge3) {
        texbetween2d(pixels, image, x2, y2, u2, v2, x3, y3, u3, v3, x3, y3, u3, v3, x1, y1, u1, v1)
      } else {
        texbetween2d(pixels, image, x2, y2, u2, v2, x3, y3, u3, v3, x1, y1, u1, v1, x3, y3, u3, v3)
      }
      if (edge1) {
        texbetween2d(pixels, image, x2, y2, u2, v2, x3, y3, u3, v3, x1, y1, u1, v1, x2, y2, u2, v2)
      } else {
        texbetween2d(pixels, image, x2, y2, u2, v2, x3, y3, u3, v3, x2, y2, u2, v2, x1, y1, u1, v1)
      }
    } else {
      if (edge3) {
        texbetween2d(pixels, image, x3, y3, u3, v3, x2, y2, u2, v2, x3, y3, u3, v3, x1, y1, u1, v1)
      } else {
        texbetween2d(pixels, image, x3, y3, u3, v3, x2, y2, u2, v2, x1, y1, u1, v1, x3, y3, u3, v3)
      }
      if (edge1) {
        texbetween2d(pixels, image, x3, y3, u3, v3, x2, y2, u2, v2, x1, y1, u1, v1, x2, y2, u2, v2)
      } else {
        texbetween2d(pixels, image, x3, y3, u3, v3, x2, y2, u2, v2, x2, y2, u2, v2, x1, y1, u1, v1)
      }
    }
  }
}

function floattexspan2d(pixels, image, x1, u1, v1, x2, u2, v2, line) {
  if (x2 > CANVAS_WIDTH) x2 = CANVAS_WIDTH

  const dx = x2 - x1
  if (dx === 0) return

  const du = u2 - u1
  const dv = v2 - v1

  let factor = 0.0
  const step = 1.0 / dx

  const src = image.pixels
  const wide = image.width

  let x = Math.round(x1)
  if (x < 0) {
    factor += -x * step
    x = 0
  }

  x2 = Math.round(x2)

  for (; x < x2; x++) {

    const utexel = 1.0 / 16.0
    const vtexel = 1.0 / 24.0

    const u = u1 + du * factor - utexel
    const v = v1 + dv * factor - vtexel

    const t = (Math.round(u) + Math.round(v) * wide) * 4

    const r = src[t]
    const g = src[t + 1]
    const b = src[t + 2]

    const i = (x + line) * 4

    pixels[i] = r
    pixels[i + 1] = g
    pixels[i + 2] = b

    factor += step
  }
}

function floattexbetween2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3, x4, y4, u4, v4) {
  const e1dy = y2 - y1
  if (e1dy === 0) return

  const e2dy = y4 - y3
  if (e2dy === 0) return

  const e1dx = x2 - x1
  const e2dx = x4 - x3

  const e1du = u2 - u1
  const e1dv = v2 - v1

  const e2du = u4 - u3
  const e2dv = v4 - v3

  let factor1 = (y3 - y1) / e1dy
  let factor2 = 0.0

  const step1 = 1.0 / e1dy
  const step2 = 1.0 / e2dy

  let y = Math.round(y3)
  if (y < 0) {
    factor1 += -y * step1
    factor2 += -y * step2
    y = 0
  }

  let f = Math.ceil(y4)
  if (f > CANVAS_HEIGHT) f = CANVAS_HEIGHT

  const end = f * CANVAS_WIDTH

  let line = y * CANVAS_WIDTH

  while (line < end) {
    const su1 = u1 + e1du * factor1
    const sv1 = v1 + e1dv * factor1

    const su2 = u3 + e2du * factor2
    const sv2 = v3 + e2dv * factor2

    const sx1 = x1 + e1dx * factor1
    const sx2 = x3 + e2dx * factor2

    if (sx1 < sx2) {
      floattexspan2d(pixels, image, sx1, su1, sv1, sx2, su2, sv2, line)
    } else {
      floattexspan2d(pixels, image, sx2, su2, sv2, sx1, su1, sv1, line)
    }

    factor1 += step1
    factor2 += step2

    line += CANVAS_WIDTH
  }
}

export function floattexture2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3) {
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
        floattexbetween2d(pixels, image, x3, y3, u3, v3, x1, y1, u1, v1, x1, y1, u1, v1, x2, y2, u2, v2)
      } else {
        floattexbetween2d(pixels, image, x3, y3, u3, v3, x1, y1, u1, v1, x2, y2, u2, v2, x1, y1, u1, v1)
      }
      if (edge2) {
        floattexbetween2d(pixels, image, x3, y3, u3, v3, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3)
      } else {
        floattexbetween2d(pixels, image, x3, y3, u3, v3, x1, y1, u1, v1, x3, y3, u3, v3, x2, y2, u2, v2)
      }
    } else {
      if (edge1) {
        floattexbetween2d(pixels, image, x1, y1, u1, v1, x3, y3, u3, v3, x1, y1, u1, v1, x2, y2, u2, v2)
      } else {
        floattexbetween2d(pixels, image, x1, y1, u1, v1, x3, y3, u3, v3, x2, y2, u2, v2, x1, y1, u1, v1)
      }
      if (edge2) {
        floattexbetween2d(pixels, image, x1, y1, u1, v1, x3, y3, u3, v3, x2, y2, u2, v2, x3, y3, u3, v3)
      } else {
        floattexbetween2d(pixels, image, x1, y1, u1, v1, x3, y3, u3, v3, x3, y3, u3, v3, x2, y2, u2, v2)
      }
    }
  } else if (zero) {
    if (edge1) {
      if (edge2) {
        floattexbetween2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x2, y2, u2, v2, x3, y3, u3, v3)
      } else {
        floattexbetween2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3, x2, y2, u2, v2)
      }
      if (edge3) {
        floattexbetween2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3, x1, y1, u1, v1)
      } else {
        floattexbetween2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x1, y1, u1, v1, x3, y3, u3, v3)
      }
    } else {
      if (edge2) {
        floattexbetween2d(pixels, image, x2, y2, u2, v2, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3)
      } else {
        floattexbetween2d(pixels, image, x2, y2, u2, v2, x1, y1, u1, v1, x3, y3, u3, v3, x2, y2, u2, v2)
      }
      if (edge3) {
        floattexbetween2d(pixels, image, x2, y2, u2, v2, x1, y1, u1, v1, x3, y3, u3, v3, x1, y1, u1, v1)
      } else {
        floattexbetween2d(pixels, image, x2, y2, u2, v2, x1, y1, u1, v1, x1, y1, u1, v1, x3, y3, u3, v3)
      }
    }
  } else {
    if (edge2) {
      if (edge3) {
        floattexbetween2d(pixels, image, x2, y2, u2, v2, x3, y3, u3, v3, x3, y3, u3, v3, x1, y1, u1, v1)
      } else {
        floattexbetween2d(pixels, image, x2, y2, u2, v2, x3, y3, u3, v3, x1, y1, u1, v1, x3, y3, u3, v3)
      }
      if (edge1) {
        floattexbetween2d(pixels, image, x2, y2, u2, v2, x3, y3, u3, v3, x1, y1, u1, v1, x2, y2, u2, v2)
      } else {
        floattexbetween2d(pixels, image, x2, y2, u2, v2, x3, y3, u3, v3, x2, y2, u2, v2, x1, y1, u1, v1)
      }
    } else {
      if (edge3) {
        floattexbetween2d(pixels, image, x3, y3, u3, v3, x2, y2, u2, v2, x3, y3, u3, v3, x1, y1, u1, v1)
      } else {
        floattexbetween2d(pixels, image, x3, y3, u3, v3, x2, y2, u2, v2, x1, y1, u1, v1, x3, y3, u3, v3)
      }
      if (edge1) {
        floattexbetween2d(pixels, image, x3, y3, u3, v3, x2, y2, u2, v2, x1, y1, u1, v1, x2, y2, u2, v2)
      } else {
        floattexbetween2d(pixels, image, x3, y3, u3, v3, x2, y2, u2, v2, x2, y2, u2, v2, x1, y1, u1, v1)
      }
    }
  }
}

function orient(x0, y0, x1, y1, x2, y2) {
  return (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)
}

export function centrictexture2d(pixels, image, x0, y0, u0, v0, x1, y1, u1, v1, x2, y2, u2, v2) {

  const src = image.pixels
  const wide = image.width

  const min_x = Math.max(Math.min(Math.min(x0, x1), x2), 0)
  const min_y = Math.max(Math.min(Math.min(y0, y1), y2), 0)
  const max_x = Math.min(Math.max(Math.max(x0, x1), x2), CANVAS_WIDTH - 1)
  const max_y = Math.min(Math.max(Math.max(y0, y1), y2), CANVAS_HEIGHT - 1)

  const acx = x2 - x0
  const acy = y2 - y0

  const abx = x1 - x0
  const aby = y1 - y0

  for (let y = min_y; y < max_y; y++) {
    for (let x = min_x; x < max_x; x++) {

      const w0 = orient(x1, y1, x2, y2, x, y)
      const w1 = orient(x2, y2, x0, y0, x, y)
      const w2 = orient(x0, y0, x1, y1, x, y)

      if (w0 >= 0 && w1 >= 0 && w2 >= 0) {

        const apx = x - x0
        const apy = y - y0

        const pcx = x2 - x
        const pcy = y2 - y

        const pbx = x1 - x
        const pby = y1 - y

        const area = acx * aby - acy * abx

        const alpha = (pcx * pby - pcy * pbx) / area
        const beta = (acx * apy - acy * apx) / area
        const gamma = 1.0 - alpha - beta

        const u = u0 * alpha + u1 * beta + u2 * gamma
        const v = v0 * alpha + v1 * beta + v2 * gamma

        const utexel = 1.0 / 16.0
        const vtexel = 1.0 / 24.0

        const t = (Math.round(u - utexel) + Math.round(v - vtexel) * wide) * 4

        // const t = (Math.round(u) + Math.round(v) * wide) * 4

        const r = src[t]
        const g = src[t + 1]
        const b = src[t + 2]

        const i = (x + y * CANVAS_WIDTH) * 4
        pixels[i] = r
        pixels[i + 1] = g
        pixels[i + 2] = b
      }
    }
  }
}
