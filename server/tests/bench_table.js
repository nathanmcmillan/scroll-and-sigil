#!/usr/bin/env node

const { performance } = require('perf_hooks')
const table = require('./tableold')

const ITERATIONS = 80000

const numbers = new Float32Array(256)
for (let i = 0; i < 256; i++) {
  numbers[i] = Math.random()
}

function randomInt(number) {
  return Math.floor(Math.random() * number)
}

function usingMap() {
  const perf = performance.now()
  const map = new Map()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    map.clear()
    for (let n = 0; n < numbers.length; n++) map.set(randomInt(128), Math.random())
    for (const value of map.values()) sum += value
  }
  console.log(sum)
  console.log('time (map)', performance.now() - perf)
}

function usingTable() {
  const perf = performance.now()
  const tab = new table.Table(table.IntHashCode)
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    table.Clear(tab)
    for (let n = 0; n < numbers.length; n++) table.Put(tab, randomInt(128), Math.random())
    const iter = table.Iter(tab)
    while (table.IterHasNext(iter)) sum += table.IterNext(iter).value
  }
  console.log(sum)
  console.log('time (table)', performance.now() - perf)
}

usingMap()
usingTable()

console.log('================================================================================')

usingMap()
usingTable()
