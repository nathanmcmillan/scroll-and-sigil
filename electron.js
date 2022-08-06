#!/usr/bin/env node

const path = require('path')
const proc = require('child_process')

const file = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron')

proc.execFile(file, ['main.js'], (error, stdout, stderr) => {
  if (error) throw error
  if (stdout) console.log(stdout)
  if (stderr) console.log(stderr)
})
