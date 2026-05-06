import { sanitizeHtml, sanitizeInlineHtml } from '@/lib/blog/sanitize';

describe('sanitizeInlineHtml', () => {
  it('elimina scripts y handlers de evento', () => {
    const dirty = `<p onclick="alert(1)">x</p><script>evil()</script><a href="javascript:void(0)">z</a>`;
    const out = sanitizeInlineHtml(dirty);
    expect(out).not.toMatch(/script/i);
    expect(out).not.toMatch(/onclick/i);
    expect(out).not.toMatch(/javascript:/i);
  });

  it('conserva formato y enlaces http seguros', () => {
    const html = `<p><strong>a</strong> <a href="https://example.com" rel="noopener">link</a></p>`;
    expect(sanitizeInlineHtml(html)).toContain('strong');
    expect(sanitizeInlineHtml(html)).toContain('https://example.com');
  });

  it('no permite div en modo inline (solo tags restringidos)', () => {
    const out = sanitizeInlineHtml('<div class="wrap"><p>inner</p></div>');
    expect(out).not.toContain('<div');
    expect(out).toContain('inner');
  });
});

describe('sanitizeHtml', () => {
  it('permite estructura de tabla y figura frente a inline', () => {
    const html = `<figure><img src="/x.png" alt="y" /><figcaption>c</figcaption></figure><table><tr><th>a</th></tr></table>`;
    const out = sanitizeHtml(html);
    expect(out).toContain('<table');
    expect(out).toContain('<img');
  });

  it('sigue bloqueando scripts en modo full', () => {
    expect(sanitizeHtml('<div><script>x</script></div>')).not.toMatch(/script/i);
  });
});
