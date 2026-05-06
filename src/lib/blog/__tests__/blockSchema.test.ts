import { afterEach, beforeEach, vi } from 'vitest';
import { BlogBlocksSchema, safeParseBlocks } from '@/lib/blog/blockSchema';

describe('safeParseBlocks', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve array vacío si el JSON no coincide con el esquema', () => {
    expect(safeParseBlocks(null)).toEqual([]);
    expect(safeParseBlocks(undefined)).toEqual([]);
    expect(safeParseBlocks([{ id: 'x', type: 'paragraph' }])).toEqual([]);
    expect(safeParseBlocks([{ id: '', type: 'paragraph', html: '' }])).toEqual([]);
  });

  it('acepta bloques válidos del discriminated union', () => {
    const blocks = [
      { id: 'h1', type: 'heading' as const, level: 2 as const, text: 'Título' },
      { id: 'p1', type: 'paragraph' as const, html: '<p>Hola</p>' },
      {
        id: 'l1',
        type: 'list' as const,
        ordered: false,
        items: ['uno'],
      },
    ];
    const parsed = safeParseBlocks(blocks);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toMatchObject({ type: 'heading', text: 'Título' });
    const full = BlogBlocksSchema.safeParse(blocks);
    expect(full.success).toBe(true);
  });

  it('rechaza heading con level fuera de 2–4', () => {
    expect(
      safeParseBlocks([{ id: 'h', type: 'heading', level: 1, text: 'x' }])
    ).toEqual([]);
  });

  it('rechaza anchorId con caracteres no permitidos', () => {
    expect(
      safeParseBlocks([
        { id: 'h', type: 'heading', level: 2, text: 'x', anchorId: 'Bad_Id' },
      ])
    ).toEqual([]);
    expect(
      safeParseBlocks([
        { id: 'h', type: 'heading', level: 2, text: 'x', anchorId: 'ok-slug' },
      ])
    ).toHaveLength(1);
  });
});
