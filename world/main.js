#!/usr/bin/env node

const http = require('http')
const fs = require('fs')
const path = require('path')
const sql = require('sqlite3')
const ws = require('ws')

const world = require('./world')

const SECTOR = path.join(__dirname, './sectors', 'test.json')
const WORLD = new world.World(SECTOR)

const DB = new sql.Database(':memory:', (err) => {
  if (err) {
    console.error(err)
  } else {
    console.log('database connected')
  }
})
DB.close()

const EXTENSIONS = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ttf': 'application/font-ttf',
  '.html': 'text/html',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
}

const SERVER = http.createServer(function (request, response) {
  console.log('request', request.url)
  let file = request.url.split('?')[0]
  if (file === '/') file = '/game.html'
  else if (file.indexOf('.') === -1) file += '.html'
  file = 'public' + file
  const extension = path.extname(file)
  const mime = EXTENSIONS[extension] || 'text/plain'
  fs.readFile(file, function (error, content) {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain' })
      response.end('404', 'utf-8')
    } else {
      response.writeHead(200, { 'Content-Type': mime })
      response.end(content, 'utf-8')
    }
  })
})

const PORT = 3000

SERVER.listen(PORT)

console.log('world on port', PORT)

const SOCKET = new ws.Server({ noServer: true })

SERVER.on('upgrade', function upgrade(request, socket, head) {
  SOCKET.handleUpgrade(request, socket, head, function done(web) {
    SOCKET.emit('connection', web, request)
  })
})

SOCKET.on('connection', (socket) => {
  console.log('socket connected')
  socket.on('message', (message) => console.log(message))
})
