const A4 = 210 / 297

function rectifyImage(imageData, corners, ratio = A4) {
  const maxWidth = Math.max(
    distance(corners[0], corners[1]),
    distance(corners[2], corners[3])
  )
  const width = Math.round(maxWidth)
  const height = Math.round(maxWidth / ratio)

  const H = findHomography(corners, width, height)
  return applyHomography(imageData, H, width, height)
}

function distance([x1, y1], [x2, y2]) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

function findHomography(toCorners, width, height) {
  const fromCorners = [[0, 0], [width, 0], [width, height], [0, height]]
  const system = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = fromCorners[i]
    const [u, v] = toCorners[i]
    system.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
    system.push([0, 0, 0, x, y, 1, -v * x, -v * y, v])
  }

  const solution = gaussJordan(system)
  return [
    [solution[0], solution[1], solution[2]],
    [solution[3], solution[4], solution[5]],
    [solution[6], solution[7],         1.0],
  ]
}

async function applyHomography(imageData, H, width, height) {
  const result = new ImageData(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [u, v] = transform(H, [x, y, 1.0])
      setPixel(result, x, y, getInterpolatedPixel(imageData, u, v))
    }
  }
  return result
}

function getInterpolatedPixel(imageData, x, y) {
  // TODO: usar uma técnica melhor de interpolação
  return getPixel(imageData, Math.round(x), Math.round(y))
}

function getPixel(imageData, x, y) {
  const i = (y * imageData.width + x) * 4
  return imageData.data.slice(i, i + 4)
}

function setPixel(imageData, x, y, rgba) {
  const i = (y * imageData.width + x) * 4
  for (let j = 0; j < 4; j++) {
    imageData.data[i + j] = rgba[j]
  }
}

/**
 * Eliminação de Gauss-Jordan
 */

function gaussJordan(system) {
  for (let i = 0, len = system.length; i < len; i++) {
    const j = system.slice(i).findIndex(row => row[i] !== 0)
    if (j > 0) swapRows(system, i, i + j)

    divideRow(system[i], system[i][i])
    for (let j = i + 1; j < len; ++j) {
      addRow(system[j], system[i], -system[j][i])
    }
  }

  for (let i = system.length - 1; i >= 0; i--) {
    for (let j = 0; j < i; j++) {
      addRow(system[j], system[i], -system[j][i])
    }
  }

  return system.map(row => row[row.length - 1])
}

/**
 * Funções auxiliares
 */

function swapRows(matrix, i, j) {
  const temp = matrix[i]
  matrix[i] = matrix[j]
  matrix[j] = temp
}

function divideRow(row, divisor) {
  for (let i = 0, len = row.length; i < len; i++) {
    row[i] /= divisor
  }
  return row
}

function addRow(toRow, fromRow, scale) {
  for (let i = 0, len = toRow.length; i < len; i++) {
    toRow[i] += scale * fromRow[i]
  }
}

function transform(matrix, vector) {
  const result = []
  for (let i = 0, len = matrix.length; i < len; i++) {
    result.push(dotProduct(matrix[i], vector))
  }
  return divideRow(result, result[result.length - 1])
}

function dotProduct(a, b) {
  let result = 0
  for (let i = 0, len = a.length; i < len; i++) {
    result += a[i] * b[i]
  }
  return result
}
