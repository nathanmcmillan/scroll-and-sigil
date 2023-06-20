#!/usr/bin/env node

const http = require('http')
const fs = require('fs')
const path = require('path')
const sql = require('sqlite3')

const world = require('./world')

function close() {
  console.log('closing...')
  if (DB) {
    try {
      DB.close()
    } catch (e) {
      console.error(e)
    }
  }
  if (SERVER) {
    try {
      SERVER.close()
    } catch (e) {
      console.error(e)
    }
  }
  process.exit(0)
}

process.on('SIGTERM', () => {
  console.log('sigterm')
  close()
})

process.on('SIGINT', () => {
  console.log('sigint')
  close()
})

const DB = new sql.Database(':memory:', (err) => {
  if (err) {
    console.error(err)
  } else {
    console.log('database connected')
  }
})

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
  const url = request.url
  if (request.method === 'POST') {
    console.log('post', url)
    const chunks = []
    request.on('data', function (data) {
      chunks.push(data)
      if (chunks.length > 100) request.connection.destroy()
    })
    request.on('end', async function () {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString())
        const receive = await world.event(url, data)
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify(receive), 'utf-8')
      } catch (e) {
        console.error(e)
        response.writeHead(500, { 'Content-Type': 'text/plain' })
        response.end('internal error', 'utf-8')
      }
    })
    return
  }
  console.log('request', url)
  let file = url.split('?')[0]
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

async function main() {
  await world.init(DB)
  SERVER.listen(PORT)
  console.log('world on port', PORT)
}

main()
