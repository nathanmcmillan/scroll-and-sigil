/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export class Client {
  constructor(canvas, context) {
    this.top = 0
    this.width = canvas.width
    this.height = canvas.height
    this.canvas = canvas
    this.context = context
  }

  keyEvent(code, down) {
    // this.state.keyEvent(code, down)
  }

  keyUp(event) {
    this.keyEvent(event.code, false)
  }

  keyDown(event) {
    this.keyEvent(event.code, true)
  }

  mouseEvent(button, down) {
    // this.state.mouseEvent(button === 0, down)
  }

  mouseUp(event) {
    this.mouseEvent(event.button, false)
  }

  mouseDown(event) {
    this.mouseEvent(event.button, true)
  }

  mouseMove(event) {
    // this.state.mouseMove(event.clientX, this.height - event.clientY)
  }

  touchStart(event) {}

  touchEnd(event) {}

  touchMove() {}

  pause() {}

  resume() {}

  resize(width, height) {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
  }

  async initialize() {
    this.image = new Image()
    this.image.src = './res/TILES.png'
  }

  async openState(open, args) {}

  update(timestamp) {}

  render() {
    const canvas = this.canvas
    const context = this.context

    context.clearRect(0, 0, canvas.width, canvas.height)

    context.beginPath()
    context.rect(20, 40, 50, 50)
    context.fillStyle = '#ff0000'
    context.fill()
    context.closePath()

    const image = this.image
    // context.drawImage(image, 10, 30)

    context.drawImage(image, 0, 0, 16, 16, 200, 100, 64, 64) // 256x128
  }
}
