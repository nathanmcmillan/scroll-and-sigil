/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const LOAD_FACTOR = 0.8
const INITIAL_BINS = 1 << 3
const MAXIMUM_BINS = 1 << 30

class TableItem {
  constructor(hash, key, value) {
    this.hash = hash
    this.key = key
    this.value = value
    this.next = null
  }
}

class Table {
  constructor(hashfunc) {
    this.size = 0
    this.bins = INITIAL_BINS
    this.items = new Array(this.bins).fill(null)
    this.hashfunc = hashfunc
    this.iter = null
    this.dead = []
  }
}

function IntHashCode(num) {
  return num
}

function StringHashCode(str) {
  const len = str.length
  let hash = 0
  for (let i = 0; i < len; i++) {
    hash = 31 * hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function getBin(table, hash) {
  return (table.bins - 1) & hash
}

function mix(hash) {
  return hash ^ (hash >> 16)
}

function resize(table) {
  const binsOld = table.bins
  const bins = binsOld << 1

  if (bins > MAXIMUM_BINS) return

  const itemsOld = table.items
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

  table.bins = bins
  table.items = items
}

function pool(table, hash, key, value) {
  if (table.dead.length === 0) return new TableItem(hash, key, value)
  const item = table.dead.pop()
  item.hash = hash
  item.key = key
  item.value = value
  return item
}

function recycle(table, item) {
  item.key = null
  item.value = null
  item.next = null
  table.dead.push(item)
}

function Put(table, key, value) {
  const hash = mix(table.hashfunc(key))
  const bin = getBin(table, hash)
  let item = table.items[bin]
  let previous = null
  while (item !== null) {
    if (hash === item.hash && key === item.key) {
      item.value = value
      return
    }
    previous = item
    item = item.next
  }
  item = pool(table, hash, key, value)
  if (previous === null) table.items[bin] = item
  else previous.next = item
  table.size++
  if (table.size > table.bins * LOAD_FACTOR) resize(table)
}

function Get(table, key) {
  const hash = mix(table.hashfunc(key))
  const bin = getBin(table, hash)
  let item = table.items[bin]
  while (item !== null) {
    if (hash === item.hash && key === item.key) return item.value
    item = item.next
  }
  return null
}

function Has(table, key) {
  return Get(table, key) !== null
}

function Remove(table, key) {
  const hash = mix(table.hashfunc(key))
  const bin = getBin(table, hash)
  let item = table.items[bin]
  let previous = null
  while (item !== null) {
    if (hash === item.hash && key === item.key) {
      if (previous === null) table.items[bin] = item.next
      else previous.next = item.next
      table.size--
      const value = item.value
      recycle(table, item)
      return value
    }
    previous = item
    item = item.next
  }
  return null
}

function Clear(table) {
  const bins = table.bins
  for (let i = 0; i < bins; i++) {
    let item = table.items[i]
    while (item !== null) {
      const next = item.next
      recycle(table, item)
      item = next
    }
    table.items[i] = null
  }
  table.size = 0
}

function IsEmpty(table) {
  return table.size === 0
}

function NotEmpty(table) {
  return table.size !== 0
}

function Size(table) {
  return table.size
}

class TableIterator {
  constructor(table) {
    this.pointer = table
    this.bin = 0
    this.item = null
    IterStart(this)
  }
}

function Iter(table) {
  if (table.iter === null) table.iter = new TableIterator(table)
  else IterStart(table.iter)
  return table.iter
}

function IterStart(iter) {
  const table = iter.pointer
  iter.bin = 0
  iter.item = null
  if (table.size !== 0) {
    const bins = table.bins
    for (let i = 0; i < bins; i++) {
      const start = table.items[i]
      if (start !== null) {
        iter.bin = i
        iter.item = start
        break
      }
    }
  }
}

function IterHasNext(iter) {
  return iter.item !== null
}

function IterNext(iter) {
  let item = iter.item
  if (item === null) return null
  const result = item
  item = item.next
  if (item === null) {
    let bin = iter.bin + 1
    const stop = iter.pointer.bins
    while (bin < stop) {
      const start = iter.pointer.items[bin]
      if (start !== null) {
        item = start
        break
      }
      bin++
    }
    iter.bin = bin
  }
  iter.item = item
  return result
}

module.exports = {
  Table: Table,
  TableIterator: TableIterator,
  IntHashCode: IntHashCode,
  StringHashCode: StringHashCode,
  Put: Put,
  Get: Get,
  Has: Has,
  Remove: Remove,
  Clear: Clear,
  IsEmpty: IsEmpty,
  NotEmpty: NotEmpty,
  Size: Size,
  Iter: Iter,
  IterStart: IterStart,
  IterHasNext: IterHasNext,
  IterNext: IterNext,
}
