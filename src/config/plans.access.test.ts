import { describe, expect, it } from 'vitest';
import { canAccessRoute } from '@/config/plans';
import { canExportBlock, canDownloadFullExportBundle } from '@/config/planExportBlocks';

describe('canAccessRoute', () => {
  it('bloquea rutas Team+ en Free', () => {
    expect(canAccessRoute('starter', '/okrs')).toBe(false);
    expect(canAccessRoute('starter', '/finanzas')).toBe(false);
    expect(canAccessRoute('starter', '/exportacion-informes')).toBe(false);
    expect(canAccessRoute('starter', '/actividad')).toBe(false);
  });

  it('permite rutas Team+ en pro', () => {
    expect(canAccessRoute('pro', '/okrs')).toBe(true);
    expect(canAccessRoute('pro', '/finanzas')).toBe(true);
    expect(canAccessRoute('pro', '/weekly-forecast')).toBe(true);
    expect(canAccessRoute('pro', '/actividad')).toBe(true);
  });

  it('bloquea Ads/API en Team', () => {
    expect(canAccessRoute('pro', '/ads')).toBe(false);
    expect(canAccessRoute('pro', '/api-keys')).toBe(false);
  });

  it('permite Ads en Agency', () => {
    expect(canAccessRoute('business', '/ads')).toBe(true);
    expect(canAccessRoute('business', '/api-keys')).toBe(true);
  });
});

describe('planExportBlocks', () => {
  it('Team tiene exports básicos pero no avanzados', () => {
    expect(canExportBlock('pro', 'deadlines')).toBe(true);
    expect(canExportBlock('pro', 'radar')).toBe(false);
    expect(canDownloadFullExportBundle('pro')).toBe(false);
  });

  it('Agency tiene exports avanzados', () => {
    expect(canExportBlock('business', 'rentability')).toBe(true);
    expect(canDownloadFullExportBundle('business')).toBe(true);
  });
});
