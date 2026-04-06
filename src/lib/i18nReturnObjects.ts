/**
 * Resultado de `t(key, { returnObjects: true })` puede no ser un array si falta la clave
 * o i18next devuelve el path como string; `.map` sobre eso lanza "map is not a function".
 */
export function i18nAsArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
