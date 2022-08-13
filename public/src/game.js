/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Client } from './client.js'
import { usingKeyboardMouse, usingPlayStation } from './input.js'
import { Socket } from './net.js'

let active = true
let client = null

const touches = []

let previous = 0

function touchIndexById(identifier) {
  for (let i = 0; i < touches.length; i++) {
    if (touches[i].identifier === identifier) return i
  }
  return -1
}

function tick(time) {
  if (active && time - previous >= 15.999) {
    previous = time
    client.update(time)
    client.render()
  }
  window.requestAnimationFrame(tick)
}

async function main() {
  const canvas = document.getElementById('canvas')
  canvas.style.display = 'block'
  canvas.style.position = 'absolute'
  canvas.style.left = '0'
  canvas.style.right = '0'
  canvas.style.top = '0'
  canvas.style.bottom = '0'
  canvas.style.margin = 'auto'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  if ('ontouchstart' in window) canvas.requestFullscreen()

  const context = canvas.getContext('2d')
  context.imageSmoothingEnabled = false

  let SocketConnection = null
  let SocketQueue = []
  let SocketSend = new DataView(new ArrayBuffer(128))
  let SocketSendIndex = 1
  let SocketSendSet = new Map()

  SocketConnection = await Socket('websocket')
  SocketConnection.binaryType = 'arraybuffer'

  SocketConnection.onclose = function () {
    SocketConnection = null
    self.on = false
    throw new Error('Lost connection to server')
  }

  let raw = await new Promise(function (resolve) {
    SocketConnection.onmessage = function (event) {
      resolve(event.data)
    }
  })

  SocketConnection.onmessage = function (event) {
    SocketQueue.push(event.data)
  }

  client = new Client(canvas, context)
  await client.initialize()

  document.getElementById('loading').remove()

  document.onkeyup = (event) => {
    client.keyUp(event)
  }

  document.onkeydown = (event) => {
    if (event.code === 'Escape') {
      if (document.fullscreenElement === null) canvas.requestFullscreen()
      else document.exitFullscreen()
    } else {
      client.keyDown(event)
    }
  }

  document.onmouseup = (event) => {
    client.mouseUp(event)
  }

  document.onmousedown = (event) => {
    client.mouseDown(event)
  }

  document.onmousemove = (event) => {
    client.mouseMove(event)
  }

  if ('ontouchstart' in window) {
    document.ontouchstart = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const content = { identifier: touch.identifier, pageX: touch.pageX, pageY: client.height - touch.pageY }
        touches.push(content)
        client.touchStart(content)
      }
    }

    document.ontouchmove = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const content = { identifier: touch.identifier, pageX: touch.pageX, pageY: client.height - touch.pageY }
        client.touchMove(content)
      }
    }

    document.ontouchend = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const index = touchIndexById(touch.identifier)
        if (index >= 0) {
          const start = touches.splice(index, 1)[0]
          client.touchEnd(start)
        }
      }
    }

    document.ontouchcancel = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const index = touchIndexById(touch.identifier)
        if (index >= 0) touches.splice(index, 1)
      }
    }
  }

  window.addEventListener('gamepadconnected', (event) => {
    const controller = event.gamepad
    console.log('controller connected', controller.buttons.length, 'buttons', controller.axes.length, 'axes')
    if (controller.buttons.length < 12 || controller.axes.length < 4) {
      console.warning('controller does not have enough buttons or axes')
      return
    }
    usingPlayStation(client.input)
    client.controllers.push(controller)
  })

  window.addEventListener('gamepaddisconnected', (event) => {
    const controller = event.gamepad
    console.log('controller disconnected: %d', controller.index)
    const array = client.controllers
    for (let c = 0; c < array.length; c++) {
      if (array[c].index === controller.index) array.splice(c, 1)
    }
    if (client.controllers.length === 0) usingKeyboardMouse(client.input)
  })

  window.onresize = () => {
    client.resize(window.innerWidth, window.innerHeight)
    if (!active) client.render()
  }

  window.onblur = () => {
    active = false
    client.pause()
  }

  window.onfocus = () => {
    active = true
    client.resume()
  }

  window.requestAnimationFrame(tick)
}

main()
