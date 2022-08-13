/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { FetchText } from './net.js'
import * as In from './input.js'

export class Client {
  constructor(canvas, context) {
    this.canvas = canvas
    this.context = context

    const keys = new Map()

    keys.set('Enter', In.BUTTON_START)
    keys.set('Space', In.BUTTON_SELECT)

    keys.set('KeyW', In.STICK_UP)
    keys.set('KeyA', In.STICK_LEFT)
    keys.set('KeyS', In.STICK_DOWN)
    keys.set('KeyD', In.STICK_RIGHT)

    keys.set('ArrowUp', In.BUTTON_X)
    keys.set('ArrowLeft', In.BUTTON_Y)
    keys.set('ArrowDown', In.BUTTON_B)
    keys.set('ArrowRight', In.BUTTON_A)

    keys.set('KeyI', In.BUTTON_X)
    keys.set('KeyJ', In.BUTTON_Y)
    keys.set('KeyK', In.BUTTON_B)
    keys.set('KeyL', In.BUTTON_A)

    keys.set('KeyQ', In.LEFT_TRIGGER)
    keys.set('KeyO', In.RIGHT_TRIGGER)

    this.keys = keys

    this.input = new In.Input()
    In.usingKeyboardMouse(this.input)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.input.set(this.keys.get(code), down)
  }

  keyUp(event) {
    this.keyEvent(event.code, false)
  }

  keyDown(event) {
    this.keyEvent(event.code, true)
  }

  mouseEvent() {}

  mouseUp(event) {
    this.mouseEvent(event.button, false)
  }

  mouseDown(event) {
    this.mouseEvent(event.button, true)
  }

  mouseMove() {}

  touchStart() {}

  touchEnd() {}

  touchMove() {}

  pause() {}

  resume() {}

  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
    this.context.imageSmoothingEnabled = false
  }

  async initialize() {
    this.image = new Image()
    this.image.src = './images/TILES.png'

    const thing = await FetchText('./map')
    console.log(thing)
  }

  update(time) {}

  render() {
    const canvas = this.canvas
    const context = this.context

    context.clearRect(0, 0, canvas.width, canvas.height)

    const image = this.image
    context.drawImage(image, 0, 0, 16, 16, 200, 100, 64, 64) // 256x128
    context.drawImage(image, 16, 0, 32, 16, 400, 100, 64, 64) // 256x128
  }
}
