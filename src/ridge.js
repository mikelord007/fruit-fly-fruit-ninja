/**
 * Fit two ridge-regression readouts with a shared normal-equation factorization.
 * Add a constant feature to samplesX when an intercept is desired.
 *
 * @returns {[Float64Array, Float64Array]} weights for fx and fy respectively
 */
export function fitRidge(samplesX, samplesY, lambda = 1e-4) {
  const rows = samplesX?.length ?? 0;
  if (!rows || samplesY?.length !== rows) {
    throw new RangeError('samplesX and samplesY must have the same non-zero row count');
  }
  const width = samplesX[0]?.length ?? 0;
  if (!width) throw new RangeError('samplesX rows must contain features');
  if (!Number.isFinite(lambda) || lambda < 0) throw new RangeError('lambda must be finite and non-negative');

  const gram = new Float64Array(width * width);
  const rhsX = new Float64Array(width);
  const rhsY = new Float64Array(width);

  for (let row = 0; row < rows; row++) {
    const features = samplesX[row];
    const target = samplesY[row];
    if (features?.length !== width || target?.length < 2) {
      throw new RangeError('sample rows must have consistent feature width and two targets');
    }
    const tx = Number(target[0]);
    const ty = Number(target[1]);
    if (!Number.isFinite(tx) || !Number.isFinite(ty)) throw new TypeError('samples must be finite');
    for (let i = 0; i < width; i++) {
      const xi = Number(features[i]);
      if (!Number.isFinite(xi)) throw new TypeError('samples must be finite');
      rhsX[i] += xi * tx;
      rhsY[i] += xi * ty;
      const offset = i * width;
      for (let j = 0; j <= i; j++) gram[offset + j] += xi * Number(features[j]);
    }
  }

  for (let i = 0; i < width; i++) {
    gram[i * width + i] += lambda;
    for (let j = 0; j < i; j++) gram[j * width + i] = gram[i * width + j];
  }

  // Cholesky with adaptive jitter. Ridge normally makes the matrix positive
  // definite; jitter also gives a finite least-norm-like result at lambda=0.
  let factor;
  let jitter = 0;
  for (let attempt = 0; attempt < 8; attempt++) {
    factor = cholesky(gram, width, jitter);
    if (factor) break;
    jitter = jitter ? jitter * 10 : Math.max(1e-12, trace(gram, width) / width * 1e-12);
  }
  if (!factor) throw new Error('ridge system could not be stabilized');
  return [solveCholesky(factor, rhsX, width), solveCholesky(factor, rhsY, width)];
}

function trace(matrix, width) {
  let sum = 0;
  for (let i = 0; i < width; i++) sum += Math.abs(matrix[i * width + i]);
  return sum || 1;
}

function cholesky(matrix, width, jitter) {
  const lower = new Float64Array(width * width);
  for (let i = 0; i < width; i++) {
    const row = i * width;
    for (let j = 0; j <= i; j++) {
      let value = matrix[row + j] + (i === j ? jitter : 0);
      const otherRow = j * width;
      for (let k = 0; k < j; k++) value -= lower[row + k] * lower[otherRow + k];
      if (i === j) {
        if (!(value > 0) || !Number.isFinite(value)) return null;
        lower[row + j] = Math.sqrt(value);
      } else {
        lower[row + j] = value / lower[otherRow + j];
      }
    }
  }
  return lower;
}

function solveCholesky(lower, rhs, width) {
  const result = new Float64Array(width);
  for (let i = 0; i < width; i++) {
    let value = rhs[i];
    const row = i * width;
    for (let j = 0; j < i; j++) value -= lower[row + j] * result[j];
    result[i] = value / lower[row + i];
  }
  for (let i = width - 1; i >= 0; i--) {
    let value = result[i];
    for (let j = i + 1; j < width; j++) value -= lower[j * width + i] * result[j];
    result[i] = value / lower[i * width + i];
  }
  return result;
}
