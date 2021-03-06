/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

class Reader {
  constructor(src) {
    this.src = src
    this.pos = 0
  }

  bool() {
    const src = this.src
    const pos = this.pos
    if (pos >= src.length) throw 'Reader out of bounds: ' + pos
    const value = src[pos]
    this.pos = pos + 1
    return value === '1'
  }

  char() {
    const src = this.src
    const pos = this.pos
    if (this.pos + 8 >= this.src.length) throw 'Reader out of bounds: ' + pos
    let value = ''
    for (let i = 0; i < 8; i++) value += src[pos + i]
    this.pos = pos + 8
    return String.fromCharCode(parseInt(value, 2))
  }

  int() {
    const src = this.src
    const pos = this.pos
    if (this.pos + 32 >= this.src.length) throw 'Reader out of bounds: ' + pos
    let value = ''
    for (let i = 0; i < 32; i++) value += src[pos + i]
    this.pos = pos + 32
    return parseInt(value, 2)
  }
}

class Node {
  constructor(ch, freq, left = null, right = null) {
    this.ch = ch
    this.freq = freq
    this.left = left
    this.right = right
  }

  leaf() {
    return this.left === null && this.right === null
  }
}

class Queue {
  constructor() {
    this.items = []
  }

  add(item) {
    const items = this.items
    const len = items.length
    for (let i = 0; i < len; i++) {
      if (item.freq < items[i].freq) {
        items.splice(i, 0, item)
        return
      }
    }
    items.push(item)
  }

  dequeue() {
    return this.items.shift()
  }

  size() {
    return this.items.length
  }
}

function char8(ch) {
  ch = ch.charCodeAt(0)
  let out = ch.toString(2)
  while (out.length < 8) out = '0' + out
  return out
}

function int32(int) {
  let out = int.toString(2)
  while (out.length < 32) out = '0' + out
  return out
}

function write(node) {
  let out = ''
  if (node.leaf()) {
    out += '1'
    out += char8(node.ch)
    return out
  }
  out += '0'
  out += write(node.left)
  out += write(node.right)
  return out
}

function codes(lookup, node, str) {
  if (node.leaf()) {
    lookup.set(node.ch, str)
  } else {
    codes(lookup, node.left, str + '0')
    codes(lookup, node.right, str + '1')
  }
}

function binary(src) {
  const len = src.length
  const array = new Uint8Array(Math.ceil(len / 8))
  let i = 0
  let pos = 0
  while (true) {
    if (i + 8 > len) {
      let value = ''
      while (i < len) value += src[i++]
      while (value.length < 8) value += '0'
      const u8 = parseInt(value, 2)
      array[pos] = u8
      break
    } else {
      let value = ''
      for (let k = 0; k < 8; k++) value += src[i + k]
      const u8 = parseInt(value, 2)
      array[pos] = u8
      pos++
      i += 8
    }
  }
  return array
}

export function compress(src) {
  const len = src.length
  if (len < 1) return null
  const map = new Map()
  let i = len
  while (i--) {
    const c = src[i]
    let f = map.get(c)
    if (f === undefined) f = 0
    map.set(c, f + 1)
  }
  const queue = new Queue()
  for (const [k, v] of map) queue.add(new Node(k, v))
  while (queue.size() > 1) {
    const a = queue.dequeue()
    const b = queue.dequeue()
    queue.add(new Node('\0', a.freq + b.freq, a, b))
  }
  const tree = queue.dequeue()
  const lookup = new Map()
  codes(lookup, tree, '')
  let out = write(tree)
  out += int32(len)
  for (let i = 0; i < len; i++) out += lookup.get(src[i])
  return binary(out)
}

function read(reader) {
  if (reader.bool()) return new Node(reader.char(), -1)
  return new Node('\0', -1, read(reader), read(reader))
}

function text(src) {
  const len = src.length
  let str = ''
  for (let i = 0; i < len; i++) {
    const u8 = src[i]
    for (let k = 7; k >= 0; k--) {
      str += ((u8 >> k) & 1) === 1 ? '1' : '0'
    }
  }
  return str
}

export function decompress(src) {
  const str = text(src)
  const reader = new Reader(str)
  const tree = read(reader)
  const len = reader.int()
  let out = ''
  for (let i = 0; i < len; i++) {
    let node = tree
    while (!node.leaf()) {
      const bool = reader.bool()
      if (bool) node = node.right
      else node = node.left
    }
    out += node.ch
  }
  return out
}
