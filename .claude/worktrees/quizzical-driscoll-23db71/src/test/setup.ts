import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Limpiar después de cada test
afterEach(() => {
  cleanup();
});

// Mock de variables de entorno
Object.defineProperty(window, 'import', {
  value: {
    meta: {
      env: {
        DEV: true,
      },
    },
  },
});

