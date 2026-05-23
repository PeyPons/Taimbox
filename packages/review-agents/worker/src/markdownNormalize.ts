/**
 * Corrige markdown frecuente de modelos (tablas en una línea, títulos pegados).
 */
export function normalizeReportMarkdown(md: string): string {
  let s = md.trim();

  // Quitar bloque JSON residual si el modelo lo antepone
  if (s.startsWith('{')) {
    const split = s.split('---MARKDOWN---');
    if (split.length >= 2) {
      s = split.slice(1).join('---MARKDOWN---').trim();
    } else {
      const mdStart = s.search(/^#\s/m);
      if (mdStart > 0) s = s.slice(mdStart);
    }
  }

  // Título principal sin # en la primera línea
  const firstLine = s.split('\n')[0]?.trim() ?? '';
  if (firstLine && !firstLine.startsWith('#') && firstLine.length < 80) {
    s = `# ${firstLine}\n\n${s.slice(firstLine.length).trimStart()}`;
  }

  // Filas de tabla pegadas: "| celda | |---|" → salto de línea entre filas
  s = s.replace(/\|\s+\|/g, '|\n|');

  // Línea en blanco antes de tablas (fila que empieza con |)
  s = s.replace(/([^\n])\n(\|[^|\n]+\|)/g, '$1\n\n$2');
  s = s.replace(/([^\n])\n(\|[-:\s|]+\|)/g, '$1\n\n$2');

  // Separar secciones ## pegadas al párrafo anterior
  s = s.replace(/([^\n])\n(## )/g, '$1\n\n$2');

  // Puntuación / resumen pegados al título sin salto
  s = s.replace(/^(# [^\n]+)\n(\*\*)/m, '$1\n\n$2');

  return s.replace(/\n{3,}/g, '\n\n').trim();
}
