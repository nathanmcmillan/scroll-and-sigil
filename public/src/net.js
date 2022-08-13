/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export async function FetchText(path) {
  return fetch(path).then((data) => {
    return data.text()
  })
}

export async function fetchImage(path) {
  const image = new Image()
  image.src = path
  return new Promise(function (resolve) {
    image.onload = resolve
  }).then(() => {
    return image
  })
}

export async function fetchModule(path) {
  const module = await import(path)
  console.log(module)
}

export async function Request(url) {
  return fetch(location.origin + '/' + url)
    .then((data) => {
      return data.text()
    })
    .catch((err) => console.error(err))
}

export async function RequestBinary(url) {
  return fetch(location.origin + '/' + url)
    .then((data) => {
      return data.arrayBuffer()
    })
    .catch((err) => console.error(err))
}

export async function Send(url, data) {
  return fetch(location.origin + '/' + url, {
    method: 'POST',
    body: data,
  })
    .then((data) => {
      return data.text()
    })
    .catch((err) => console.error(err))
}

export async function Socket(url) {
  url = location.host + '/' + url
  // url = location.hostname + ':3002'
  return new Promise(function (resolve, reject) {
    let socket
    if (location.protocol === 'https:') {
      socket = new WebSocket('wss://' + url)
    } else {
      socket = new WebSocket('ws://' + url)
    }
    socket.onopen = function () {
      resolve(socket)
    }
    socket.onerror = function (err) {
      reject(err)
    }
  })
}
