/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const LOAD_FACTOR = 0.8
const INITIAL_BINS = 1 << 3
const MAXIMUM_BINS = 1 << 30

function intHashCode(num) {
  return num
}

function stringHashCode(str) {
  const len = str.length
  let hash = 0
  for (let i = 0; i < len; i++) {
    hash = 31 * hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function mix(hash) {
  return hash ^ (hash >> 16)
}

class TableItem {
  constructor(hash, key, value) {
    this.hash = hash
    this.key = key
    this.value = value
    this.next = null
  }
}

class Table {
  constructor(func) {
    this.size = 0
    this.bins = INITIAL_BINS
    this.items = new Array(this.bins).fill(null)
    this.func = func
    this.iterator = null
    this.dead = []
  }

  getBin(hash) {
    return (this.bins - 1) & hash
  }

  resize() {
    const binsOld = this.bins
    const bins = binsOld << 1

    if (bins > MAXIMUM_BINS) return

    const itemsOld = this.items
    const items = new Array(bins).fill(null)
    for (let i = 0; i < binsOld; i++) {
      let item = itemsOld[i]
      if (item === null) continue
      if (item.next === null) {
        items[(bins - 1) & item.hash] = item
      } else {
        let lowHead = null
        let lowTail = null
        let highHead = null
        let highTail = null
        do {
          if ((binsOld & item.hash) === 0) {
            if (lowTail === null) lowHead = item
            else lowTail.next = item
            lowTail = item
          } else {
            if (highTail === null) highHead = item
            else highTail.next = item
            highTail = item
          }
          item = item.next
        } while (item !== null)

        if (lowTail !== null) {
          lowTail.next = null
          items[i] = lowHead
        }

        if (highTail !== null) {
          highTail.next = null
          items[i + binsOld] = highHead
        }
      }
    }

    this.bins = bins
    this.items = items
  }

  pool(hash, key, value) {
    if (this.dead.length === 0) return new TableItem(hash, key, value)
    const item = this.dead.pop()
    item.hash = hash
    item.key = key
    item.value = value
    return item
  }

  recycle(item) {
    item.key = null
    item.value = null
    item.next = null
    this.dead.push(item)
  }

  set(key, value) {
    const hash = mix(this.func(key))
    const bin = this.getBin(hash)
    let item = this.items[bin]
    let previous = null
    while (item !== null) {
      if (hash === item.hash && key === item.key) {
        item.value = value
        return
      }
      previous = item
      item = item.next
    }
    item = this.pool(hash, key, value)
    if (previous === null) this.items[bin] = item
    else previous.next = item
    this.size++
    if (this.size > this.bins * LOAD_FACTOR) this.resize()
  }

  get(key) {
    const hash = mix(this.func(key))
    const bin = this.getBin(hash)
    let item = this.items[bin]
    while (item !== null) {
      if (hash === item.hash && key === item.key) return item.value
      item = item.next
    }
    return null
  }

  has(key) {
    return this.get(key) !== null
  }

  remove(key) {
    const hash = mix(this.func(key))
    const bin = this.getBin(hash)
    let item = this.items[bin]
    let previous = null
    while (item !== null) {
      if (hash === item.hash && key === item.key) {
        if (previous === null) this.items[bin] = item.next
        else previous.next = item.next
        this.size--
        const value = item.value
        this.recycle(item)
        return value
      }
      previous = item
      item = item.next
    }
    return null
  }

  clear() {
    const bins = this.bins
    for (let i = 0; i < bins; i++) {
      let item = this.items[i]
      while (item !== null) {
        const next = item.next
        this.recycle(item)
        item = next
      }
      this.items[i] = null
    }
    this.size = 0
  }

  empty() {
    return this.size === 0
  }

  notEmpty() {
    return this.size !== 0
  }

  size() {
    return this.size
  }

  iter() {
    if (this.iterator === null) this.iterator = new TableIterator(this)
    else this.iterator.start()
    return this.iterator
  }
}

class TableIterator {
  constructor(table) {
    this.pointer = table
    this.bin = 0
    this.item = null
    this.start()
  }

  start() {
    const table = this.pointer
    this.bin = 0
    this.item = null
    if (table.size !== 0) {
      const bins = table.bins
      for (let i = 0; i < bins; i++) {
        const start = table.items[i]
        if (start !== null) {
          this.bin = i
          this.item = start
          break
        }
      }
    }
  }

  hasNext() {
    return this.item !== null
  }

  next() {
    let item = this.item
    if (item === null) return null
    const result = item
    item = item.next
    if (item === null) {
      let bin = this.bin + 1
      const stop = this.pointer.bins
      while (bin < stop) {
        const start = this.pointer.items[bin]
        if (start !== null) {
          item = start
          break
        }
        bin++
      }
      this.bin = bin
    }
    this.item = item
    return result
  }
}

module.exports = {
  Table: Table,
  TableIterator: TableIterator,
  intHashcode: intHashCode,
  stringHashcode: stringHashCode,
}
