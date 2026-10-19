// hook-stdin.mjs: lee la carga JSON que el harness pasa a un hook por stdin, con tope de 1 MB,
// plazo de 2 s y falla abierta: vacío, plazo vencido o error devuelven '' y el hook sale en silencio.

const DEFAULT_MAX_BYTES = 1_048_576;
const DEFAULT_TIMEOUT_MS = 2000;

/**
 * Lee `process.stdin` hasta EOF. Devuelve `''` con la entrada vacía, con el plazo vencido o ante
 * cualquier error; con más de `maxBytes` devuelve los primeros `maxBytes` bytes.
 */
export async function readStdin({
  maxBytes = DEFAULT_MAX_BYTES,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  try {
    return await collect(process.stdin, maxBytes, timeoutMs);
  } catch {
    return '';
  }
}

function collect(stream, maxBytes, timeoutMs) {
  return new Promise(resolve => {
    const chunks = [];
    let size = 0;
    let settled = false;
    let timer = null;

    const finish = text => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      stream.off('data', onData);
      stream.off('end', onEnd);
      stream.off('error', onError);
      // Sin soltar `fd 0`, un pipe que nadie cierra mantiene vivo el bucle de eventos y el hook
      // no termina aunque su lectura ya haya devuelto.
      stream.pause();
      stream.unref?.();
      resolve(text);
    };

    const onData = chunk => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(buffer);
      size += buffer.length;
      if (size <= maxBytes) return;
      process.stderr.write(
        `hook-stdin: entrada recortada a ${maxBytes} bytes (llegaron ${size} o más).\n`,
      );
      finish(Buffer.concat(chunks, maxBytes).toString('utf8'));
    };
    const onEnd = () => finish(Buffer.concat(chunks).toString('utf8'));
    const onError = () => finish('');

    timer = setTimeout(() => finish(''), timeoutMs);
    // Un plazo pendiente no tiene por qué demorar la salida del hook que ya leyó todo.
    timer.unref?.();

    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onError);
    stream.resume();
  });
}
