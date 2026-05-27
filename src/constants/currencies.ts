/** ISO 4217 — monedas soportadas en la agencia (rentabilidad, fees, nóminas). */
export type AgencyCurrencyCode =
  | 'EUR'
  | 'USD'
  | 'GBP'
  | 'MXN'
  | 'ARS'
  | 'COP'
  | 'CLP'
  | 'PEN'
  | 'BRL'
  | 'CAD'
  | 'CHF'
  | 'UYU'
  | 'BOB'
  | 'PYG'
  | 'CRC'
  | 'GTQ'
  | 'DOP';

export const DEFAULT_AGENCY_CURRENCY: AgencyCurrencyCode = 'EUR';

export const AGENCY_CURRENCY_CODES: readonly AgencyCurrencyCode[] = [
  'EUR',
  'USD',
  'GBP',
  'MXN',
  'ARS',
  'COP',
  'CLP',
  'PEN',
  'BRL',
  'CAD',
  'CHF',
  'UYU',
  'BOB',
  'PYG',
  'CRC',
  'GTQ',
  'DOP',
] as const;

/** Etiquetas para selectores (nombre + código). */
export const AGENCY_CURRENCY_OPTIONS: { value: AgencyCurrencyCode; labelEs: string; labelEn: string }[] = [
  { value: 'EUR', labelEs: 'Euro (EUR)', labelEn: 'Euro (EUR)' },
  { value: 'USD', labelEs: 'Dólar estadounidense (USD)', labelEn: 'US dollar (USD)' },
  { value: 'GBP', labelEs: 'Libra esterlina (GBP)', labelEn: 'British pound (GBP)' },
  { value: 'MXN', labelEs: 'Peso mexicano (MXN)', labelEn: 'Mexican peso (MXN)' },
  { value: 'ARS', labelEs: 'Peso argentino (ARS)', labelEn: 'Argentine peso (ARS)' },
  { value: 'COP', labelEs: 'Peso colombiano (COP)', labelEn: 'Colombian peso (COP)' },
  { value: 'CLP', labelEs: 'Peso chileno (CLP)', labelEn: 'Chilean peso (CLP)' },
  { value: 'PEN', labelEs: 'Sol peruano (PEN)', labelEn: 'Peruvian sol (PEN)' },
  { value: 'BRL', labelEs: 'Real brasileño (BRL)', labelEn: 'Brazilian real (BRL)' },
  { value: 'CAD', labelEs: 'Dólar canadiense (CAD)', labelEn: 'Canadian dollar (CAD)' },
  { value: 'CHF', labelEs: 'Franco suizo (CHF)', labelEn: 'Swiss franc (CHF)' },
  { value: 'UYU', labelEs: 'Peso uruguayo (UYU)', labelEn: 'Uruguayan peso (UYU)' },
  { value: 'BOB', labelEs: 'Boliviano (BOB)', labelEn: 'Bolivian boliviano (BOB)' },
  { value: 'PYG', labelEs: 'Guaraní (PYG)', labelEn: 'Paraguayan guaraní (PYG)' },
  { value: 'CRC', labelEs: 'Colón costarricense (CRC)', labelEn: 'Costa Rican colón (CRC)' },
  { value: 'GTQ', labelEs: 'Quetzal (GTQ)', labelEn: 'Guatemalan quetzal (GTQ)' },
  { value: 'DOP', labelEs: 'Peso dominicano (DOP)', labelEn: 'Dominican peso (DOP)' },
];

export function isAgencyCurrencyCode(value: string | undefined | null): value is AgencyCurrencyCode {
  return !!value && (AGENCY_CURRENCY_CODES as readonly string[]).includes(value);
}
