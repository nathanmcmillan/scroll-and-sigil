#!/usr/bin/env node

class Foo {
  constructor() {
    this.x = 0
    this.y = 0
  }

  update() {
    this.x += Math.random()
    this.y += Math.random()
  }
}

class Bar {
  constructor() {
    this.x = 0
    this.y = 0
  }
}

function FooUpdate(foo) {
  foo.x += Math.random()
  foo.y += Math.random()
}

const { performance } = require('perf_hooks')

const ITERATIONS = 100000

function usingClass() {
  const perf = performance.now()
  const foo = new Foo()
  for (let i = 0; i < ITERATIONS; i++) {
    foo.update()
  }
  console.log(foo.x, foo.y)
  console.log('time (class)', performance.now() - perf)
}

function usingStatic() {
  const perf = performance.now()
  const bar = new Bar()
  for (let i = 0; i < ITERATIONS; i++) {
    FooUpdate(bar)
  }
  console.log(bar.x, bar.y)
  console.log('time (static)', performance.now() - perf)
}

usingClass()
usingStatic()

console.log('================================================================================')

usingClass()
usingStatic()
