import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/icons')
fs.mkdirSync(outputDir, { recursive: true })

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const name = Buffer.from(type)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  return Buffer.concat([length, name, data, checksum])
}

function encodePng(width, height, pixels) {
  const scanlines = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1)
    scanlines[rowStart] = 0
    pixels.copy(scanlines, rowStart + 1, y * width * 4, (y + 1) * width * 4)
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function createCanvas(width, height, maskable = false) {
  const pixels = Buffer.alloc(width * height * 4)
  const set = (x, y, color) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const index = (y * width + x) * 4
    pixels[index] = color[0]
    pixels[index + 1] = color[1]
    pixels[index + 2] = color[2]
    pixels[index + 3] = color[3]
  }
  const scale = Math.min(width, height)
  const point = (value) => Math.round(value * scale)
  const navy = [7, 29, 65, 255]
  const blue = [43, 131, 232, 255]
  const lightBlue = [99, 185, 255, 255]
  const white = [255, 255, 255, 255]

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const distance = Math.min(x, y, width - x - 1, height - y - 1)
      const rounded = maskable || distance >= point(0.1)
      if (!rounded) continue
      const progress = (x + y) / (width + height)
      set(x, y, [7 + Math.round(progress * 4), 29 + Math.round(progress * 35), 65 + Math.round(progress * 65), 255])
    }
  }

  const polygon = (points, color) => {
    const scaled = points.map(([x, y]) => [point(x), point(y)])
    const minY = Math.max(0, Math.min(...scaled.map((item) => item[1])))
    const maxY = Math.min(height - 1, Math.max(...scaled.map((item) => item[1])))
    for (let y = minY; y <= maxY; y += 1) {
      const intersections = []
      for (let i = 0; i < scaled.length; i += 1) {
        const [x1, y1] = scaled[i]
        const [x2, y2] = scaled[(i + 1) % scaled.length]
        if ((y1 > y) !== (y2 > y)) intersections.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1))
      }
      intersections.sort((a, b) => a - b)
      for (let i = 0; i < intersections.length; i += 2) {
        for (let x = Math.ceil(intersections[i]); x <= Math.floor(intersections[i + 1]); x += 1) set(x, y, color)
      }
    }
  }

  const circle = (cx, cy, radius, color) => {
    const centerX = point(cx)
    const centerY = point(cy)
    const size = point(radius)
    for (let y = centerY - size; y <= centerY + size; y += 1) {
      for (let x = centerX - size; x <= centerX + size; x += 1) {
        if ((x - centerX) ** 2 + (y - centerY) ** 2 <= size ** 2) set(x, y, color)
      }
    }
  }

  const line = (x1, y1, x2, y2, color, thickness = 0.02) => {
    const startX = point(x1)
    const startY = point(y1)
    const endX = point(x2)
    const endY = point(y2)
    const steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY))
    for (let step = 0; step <= steps; step += 1) {
      const progress = steps ? step / steps : 0
      circle((startX + (endX - startX) * progress) / scale, (startY + (endY - startY) * progress) / scale, thickness, color)
    }
  }

  const inset = maskable ? 0.25 : 0.18
  polygon([[inset, 0.24], [inset + 0.14, 0.24], [0.5, 0.5], [0.86 - inset + 0.14, 0.24], [0.86, 0.24], [0.5, 0.78]], white)
  polygon([[0.4, 0.5], [0.6, 0.5], [0.5, 0.68]], blue)
  line(0.5, 0.68, 0.5, 0.49, white, 0.024)
  line(0.5, 0.56, 0.42, 0.48, white, 0.024)
  line(0.5, 0.6, 0.59, 0.5, white, 0.024)
  circle(0.42, 0.48, 0.045, white)
  circle(0.59, 0.5, 0.045, white)
  line(0.62, 0.38, 0.77, 0.39, lightBlue, 0.024)
  line(0.77, 0.39, 0.87, 0.34, lightBlue, 0.024)
  circle(0.62, 0.38, 0.04, lightBlue)
  circle(0.77, 0.39, 0.04, lightBlue)
  circle(0.87, 0.34, 0.04, lightBlue)
  return pixels
}

function writeIcon(name, size, maskable = false) {
  fs.writeFileSync(path.join(outputDir, name), encodePng(size, size, createCanvas(size, size, maskable)))
}

function createSplash() {
  const width = 1200
  const height = 1800
  const icon = createCanvas(1200, 1200)
  const pixels = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      pixels[index] = 247
      pixels[index + 1] = 250
      pixels[index + 2] = 255
      pixels[index + 3] = 255
    }
  }
  for (let y = 0; y < icon.length / (1200 * 4); y += 1) {
    icon.copy(pixels, ((y + 300) * width) * 4, y * 1200 * 4, (y + 1) * 1200 * 4)
  }
  return pixels
}

writeIcon('yechim-180.png', 180)
writeIcon('yechim-192.png', 192)
writeIcon('yechim-512.png', 512)
writeIcon('yechim-maskable-512.png', 512, true)
fs.writeFileSync(path.join(outputDir, 'yechim-splash.png'), encodePng(1200, 1800, createSplash()))
