/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { hsb, rgb, red, green, blue } from './colors.js'

export const SPRITE_SCALE = 2

// export const TILE_SHIFT = 4 // 16

const WIDE = 16
const TALL = 16

export const TILE_WIDTH = WIDE * SPRITE_SCALE
export const TILE_HEIGHT = TALL * SPRITE_SCALE

const BRICK_WALL = [0, 0, WIDE, TALL]
const STONE_GROUND = [144, 0, WIDE, TALL]
const BRICK_WALL_STONE_GROUND = [112, 0, WIDE, TALL]

export class Tile {
  constructor() {
    this.floorColor = null
    this.floorSprite = null
    this.sideSprite = null
    this.ceilSprite = null
    this.things = []
    this.thingCount = 0
  }
}

export function clearTile(tile) {
  tile.things.length = 0
  tile.thingCount = 0
}

export function tilePushThing(tile, thing) {
  const things = tile.things
  if (things.length === tile.thingCount) things.push(thing)
  else things[tile.thingCount] = thing
  tile.thingCount++
}

export function tileRemoveThing(tile, thing) {
  const things = tile.things
  const index = things.indexOf(thing)
  tile.thingCount--
  things[index] = things[tile.thingCount]
  things[tile.thingCount] = null
}

export const FLOOR_SPRITES = [STONE_GROUND, null, null, null]

export const SIDE_SPRITES = [null, BRICK_WALL, BRICK_WALL_STONE_GROUND, null]

export const CEIL_SPRITES = [null, STONE_GROUND, BRICK_WALL_STONE_GROUND, null]

export function ground(c) {
  const c1 = rgb(hsb(c[0], c[1], c[2]))
  const c2 = rgb(hsb(c[3], c[4], c[5]))
  const c3 = rgb(hsb(c[6], c[7], c[8]))
  const c4 = rgb(hsb(c[9], c[10], c[11]))
  const c5 = rgb(hsb(c[12], c[13], c[14]))
  const c6 = rgb(hsb(c[15], c[16], c[17]))
  return [
    false,
    red(c1),
    green(c1),
    blue(c1),
    red(c2),
    green(c2),
    blue(c2),
    red(c3),
    green(c3),
    blue(c3),
    red(c4),
    green(c4),
    blue(c4),
    red(c5),
    green(c5),
    blue(c5),
    red(c6),
    green(c6),
    blue(c6),
  ]
}

const HERO = [0, 0, 16, 19]
const RAT = [16, 0, 18, 13]

export function monsterSprite(name) {
  switch (name) {
    case 'hero':
      return HERO
    case 'rat':
      return RAT
    default:
      return null
  }
}
