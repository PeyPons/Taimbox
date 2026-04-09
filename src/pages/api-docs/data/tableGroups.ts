import type { ErrorCode, TableGroup } from './types';
import { ERROR_CODES, TABLE_GROUPS } from './tables';
import { ERROR_CODES_EN, TABLE_GROUPS_EN } from './tables.en';

export function getTableGroups(lang: string): TableGroup[] {
  return lang.startsWith('en') ? TABLE_GROUPS_EN : TABLE_GROUPS;
}

export function getErrorCodes(lang: string): ErrorCode[] {
  return lang.startsWith('en') ? ERROR_CODES_EN : ERROR_CODES;
}
