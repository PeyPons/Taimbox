/**
 * Helpers para trocear copy del blog con marcadores artificiales (<LocaleLink>, …)
 * sin llamar .split sobre undefined si falta traducción o el formato no coincide.
 */

export function i18nPlainString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return "";
}

function splitFirst(haystack: string, needle: string): [string, string | undefined] {
  const i = haystack.indexOf(needle);
  if (i === -1) return [haystack, undefined];
  return [haystack.slice(0, i), haystack.slice(i + needle.length)];
}

export type GestionCapsuleParts = {
  before1: string;
  link1: string;
  between12: string;
  link2: string;
  between23: string;
  link3: string;
  after3: string;
};

/** Cápsula con <LocaleLink1>…</Link1> … <LocaleLink3>…</Link3> (post gestión de carga). */
export function parseGestionCapsule(
  raw: unknown,
): { ok: true; p: GestionCapsuleParts } | { ok: false; plain: string } {
  const s = i18nPlainString(raw);
  if (!s.includes("<LocaleLink1>")) return { ok: false, plain: s };

  const [before1, afterL1] = splitFirst(s, "<LocaleLink1>");
  if (afterL1 == null) return { ok: false, plain: s };
  const [link1, after1Close] = splitFirst(afterL1, "</Link1>");
  if (after1Close == null) return { ok: false, plain: s };

  const [between12, afterL2] = splitFirst(after1Close, "<LocaleLink2>");
  if (afterL2 == null) return { ok: false, plain: s };
  const [link2, after2Close] = splitFirst(afterL2, "</Link2>");
  if (after2Close == null) return { ok: false, plain: s };

  const [between23, afterL3] = splitFirst(after2Close, "<LocaleLink3>");
  if (afterL3 == null) return { ok: false, plain: s };
  const [link3, after3Close] = splitFirst(afterL3, "</Link3>");
  if (after3Close == null) return { ok: false, plain: s };

  return {
    ok: true,
    p: {
      before1,
      link1,
      between12,
      link2,
      between23,
      link3,
      after3: after3Close,
    },
  };
}

export type OneLocaleLinkParts = { before: string; link: string; after: string };

export function parseOneLocaleLink(
  raw: unknown,
): { ok: true; p: OneLocaleLinkParts } | { ok: false; plain: string } {
  const s = i18nPlainString(raw);
  if (!s.includes("<LocaleLink>")) return { ok: false, plain: s };

  const [before, afterOpen] = splitFirst(s, "<LocaleLink>");
  if (afterOpen == null) return { ok: false, plain: s };
  const [link, after] = splitFirst(afterOpen, "</LocaleLink>");
  if (after == null) return { ok: false, plain: s };

  return { ok: true, p: { before, link, after } };
}

export type TwoLocaleLinkParts = {
  before1: string;
  link1: string;
  between: string;
  link2: string;
  after: string;
};

/** Párrafo con dos <LocaleLink>…</LocaleLink> (p. ej. section5.p2 rentabilidad). */
export function parseTwoLocaleLinks(
  raw: unknown,
): { ok: true; p: TwoLocaleLinkParts } | { ok: false; plain: string } {
  const s = i18nPlainString(raw);
  if (!s.includes("<LocaleLink>")) return { ok: false, plain: s };

  const [before1, a1] = splitFirst(s, "<LocaleLink>");
  if (a1 == null) return { ok: false, plain: s };
  const [link1, a2] = splitFirst(a1, "</LocaleLink>");
  if (a2 == null) return { ok: false, plain: s };

  const [between, a3] = splitFirst(a2, "<LocaleLink>");
  if (a3 == null) return { ok: false, plain: s };
  const [link2, after] = splitFirst(a3, "</LocaleLink>");
  if (after == null) return { ok: false, plain: s };

  return { ok: true, p: { before1, link1, between, link2, after } };
}
