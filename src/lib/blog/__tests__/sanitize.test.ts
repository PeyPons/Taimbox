import { describe, expect, it } from "vitest";
import { sanitizeHtml, sanitizeInlineHtml } from "../sanitize";

describe("sanitizeInlineHtml", () => {
  it("elimina script y conserva marcado seguro basico", () => {
    const dirty = '<script>alert(1)</script><p class="x">Hola <strong>mundo</strong></p>';
    const out = sanitizeInlineHtml(dirty);
    expect(out).not.toMatch(/script/i);
    expect(out).toContain("Hola");
    expect(out).toContain("mundo");
  });

  it("elimina handlers de evento inline", () => {
    const dirty = '<a href="https://example.com" onclick="alert(1)">link</a>';
    const out = sanitizeInlineHtml(dirty);
    expect(out).not.toMatch(/onclick/i);
    expect(out).toMatch(/href=/i);
  });
});

describe("sanitizeHtml", () => {
  it("permite estructura de tabla y elimina script", () => {
    const dirty =
      '<script>x</script><table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
    const out = sanitizeHtml(dirty);
    expect(out).not.toMatch(/script/i);
    expect(out).toContain("table");
    expect(out).toContain("th");
    expect(out).toContain("td");
  });
});
