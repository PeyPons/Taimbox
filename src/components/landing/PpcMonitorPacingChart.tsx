import { useEffect, useMemo, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';

/**
 * Modelo conceptual: pacing de gasto PPC (gasto acumulado vs ritmo ideal lineal del mes).
 * Animación en bucle continuo (sin controles de reproducción).
 */

const W = 800;
const H = 300;
const PAD = { l: 56, r: 28, t: 32, b: 48 } as const;
const INNER_W = W - PAD.l - PAD.r;
const INNER_H = H - PAD.t - PAD.b;
const STEP = 0.4;
const SAMPLE_COUNT = Math.floor(100 / STEP) + 1;

const REFERENCE_BUDGET_EUR = 10000;

const DURATION_DRAW_MS = 8200;
const PAUSE_END_MS = 10000;
const CYCLE_MS = DURATION_DRAW_MS + PAUSE_END_MS;

const P = 'commercial.ppc.page.chart';

/** % de mes transcurrido t∈[0,100] → % de presupuesto gastado acumulado (conceptual, puede >100). */
function spendPctAtMonth(t: number): number {
  const u = Math.min(100, Math.max(0, t));
  const k = 0.25;
  return u * (1 + k * (u / 100) * (u / 100));
}

function xMonth(t: number): number {
  return PAD.l + (t / 100) * INNER_W;
}

/** y: arriba = más gasto acumulado, abajo = menos (0% en la base). */
function ySpend(pct: number): number {
  const maxScale = 140;
  const p = Math.min(maxScale, Math.max(0, pct));
  return PAD.t + INNER_H * (1 - p / maxScale);
}

function zoneDotColor(monthT: number, spent: number): string {
  const ideal = monthT;
  if (spent <= ideal * 1.02) return '#34d399';
  if (spent <= ideal * 1.12) return '#fbbf24';
  return '#fb7185';
}

const POINTS: { px: number; py: number; t: number; spent: number }[] = [];
for (let i = 0; i < SAMPLE_COUNT; i++) {
  const t = i * STEP;
  const spent = spendPctAtMonth(t);
  POINTS.push({ px: xMonth(t), py: ySpend(spent), t, spent });
}

function buildActualPath(upToIdx: number): string {
  const parts: string[] = [];
  for (let i = 0; i <= upToIdx; i++) {
    const { px, py } = POINTS[i];
    parts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return parts.join(' ');
}

const IDEAL_D = (() => {
  const p0 = `${xMonth(0).toFixed(1)} ${ySpend(0).toFixed(1)}`;
  const p1 = `${xMonth(100).toFixed(1)} ${ySpend(100).toFixed(1)}`;
  return `M${p0} L${p1}`;
})();

const GRID_LINES = [0, 35, 70, 100, 130].map((pct) => ({
  pct,
  y: ySpend(pct),
}));

export function PpcMonitorPacingChart() {
  const { t, i18n } = useTranslation('landing');
  const pathRef = useRef<SVGPathElement>(null);
  const pathGlowRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<SVGTextElement>(null);
  const overrunRef = useRef<SVGTextElement>(null);
  const rafRef = useRef(0);

  const locale = i18n.language.startsWith('en') ? 'en-GB' : 'es-ES';
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  useEffect(() => {
    const pathEl = pathRef.current;
    const glowEl = pathGlowRef.current;
    const dotEl = dotRef.current;
    const labelEl = labelRef.current;
    const overrunEl = overrunRef.current;
    if (!pathEl || !glowEl || !dotEl || !labelEl || !overrunEl) return;

    let startTime: number | null = null;
    const deltaPrefix = t(`${P}.deltaPrefix`);

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = (now - startTime) % CYCLE_MS;

      let idx: number;
      if (elapsed < DURATION_DRAW_MS) {
        const drawT = elapsed / DURATION_DRAW_MS;
        const eased = drawT < 0.5 ? 2 * drawT * drawT : 1 - (-2 * drawT + 2) ** 2 / 2;
        idx = Math.round(eased * (POINTS.length - 1));
      } else {
        idx = POINTS.length - 1;
      }

      idx = Math.max(0, Math.min(POINTS.length - 1, idx));
      const pt = POINTS[idx];
      const d = buildActualPath(idx);

      pathEl.setAttribute('d', d);
      glowEl.setAttribute('d', d);
      dotEl.setAttribute('cx', String(pt.px));
      dotEl.setAttribute('cy', String(pt.py));
      dotEl.setAttribute('fill', zoneDotColor(pt.t, pt.spent));

      const spentAmount = (pt.spent / 100) * REFERENCE_BUDGET_EUR;

      const labelY = Math.max(PAD.t + 14, pt.py - 16);
      labelEl.setAttribute('x', String(pt.px));
      labelEl.setAttribute('y', String(labelY));
      labelEl.textContent = formatter.format(spentAmount);
      labelEl.setAttribute('fill', zoneDotColor(pt.t, pt.spent));

      const diff = spentAmount - REFERENCE_BUDGET_EUR;
      const over = Math.max(0, diff);
      const overStr = formatter.format(over).replace(/\s/g, '');
      const bracket = over > 0 ? `[+${overStr}]` : `[${formatter.format(0)}]`;
      overrunEl.textContent = `${deltaPrefix}${bracket}`;
      overrunEl.setAttribute('fill', over > 0 ? 'rgb(248 113 113)' : 'rgb(148 163 184)');
      overrunEl.setAttribute('text-anchor', 'middle');
      overrunEl.setAttribute('x', String(pt.px));
      const overrunY = Math.min(PAD.t + INNER_H - 4, pt.py + 22);
      overrunEl.setAttribute('y', String(overrunY));

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [formatter, t, i18n.language]);

  const gx1 = PAD.l;
  const gx2 = W - PAD.r;

  return (
    <div className="relative h-full rounded-2xl border border-white/15 bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgb(251_191_36/0.08),transparent)] pointer-events-none" />

      <div className="relative w-full h-full min-h-[220px] sm:min-h-[260px] md:min-h-[300px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full block min-h-[220px] sm:min-h-[260px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-hidden
        >
          <title>{t(`${P}.title`)}</title>
          <defs>
            <linearGradient id="ppc-ideal" x1={gx1} y1={PAD.t} x2={gx2} y2={PAD.t + INNER_H} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgb(148 163 184)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(148 163 184)" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="ppc-line" x1={gx1} y1="0" x2={gx2} y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="42%" stopColor="#34d399" />
              <stop offset="68%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
            <filter id="ppc-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="ppc-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x={xMonth(0)} y={PAD.t} width={xMonth(50) - xMonth(0)} height={INNER_H} fill="rgb(16 185 129 / 0.07)" />
          <rect x={xMonth(50)} y={PAD.t} width={xMonth(80) - xMonth(50)} height={INNER_H} fill="rgb(251 191 36 / 0.05)" />
          <rect x={xMonth(80)} y={PAD.t} width={xMonth(100) - xMonth(80)} height={INNER_H} fill="rgb(251 113 133 / 0.07)" />

          {GRID_LINES.map(({ pct, y }, i) => (
            <line
              key={i}
              x1={PAD.l}
              y1={y}
              x2={W - PAD.r}
              y2={y}
              stroke="rgb(255 255 255 / 0.06)"
              strokeWidth={1}
              strokeDasharray="4 6"
            />
          ))}

          {GRID_LINES.map(({ pct, y }, i) => (
            <text
              key={`y-${i}`}
              x={PAD.l - 8}
              y={y + 4}
              textAnchor="end"
              fill="rgb(148 163 184 / 0.95)"
              fontSize={10}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {pct}%
            </text>
          ))}

          <line
            x1={PAD.l}
            y1={PAD.t + INNER_H}
            x2={W - PAD.r}
            y2={PAD.t + INNER_H}
            stroke="rgb(255 255 255 / 0.22)"
            strokeWidth={1.5}
          />
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + INNER_H} stroke="rgb(255 255 255 / 0.22)" strokeWidth={1.5} />

          <text
            x={W / 2}
            y={H - 12}
            textAnchor="middle"
            fill="rgb(203 213 225 / 0.95)"
            fontSize={12}
            fontWeight={500}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {t(`${P}.axisX`)}
          </text>
          <text
            x={18}
            y={H / 2}
            textAnchor="middle"
            fill="rgb(203 213 225 / 0.95)"
            fontSize={12}
            fontWeight={500}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            transform={`rotate(-90 18 ${H / 2})`}
          >
            {t(`${P}.axisY`)}
          </text>

          <path
            d={IDEAL_D}
            fill="none"
            stroke="url(#ppc-ideal)"
            strokeWidth={2}
            strokeDasharray="6 5"
            strokeLinecap="round"
          />

          <path
            ref={pathGlowRef}
            d={`M${POINTS[0].px.toFixed(1)} ${POINTS[0].py.toFixed(1)}`}
            fill="none"
            stroke="url(#ppc-line)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
            filter="url(#ppc-glow)"
          />

          <path
            ref={pathRef}
            d={`M${POINTS[0].px.toFixed(1)} ${POINTS[0].py.toFixed(1)}`}
            fill="none"
            stroke="url(#ppc-line)"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ppc-glow)"
          />

          <circle
            ref={dotRef}
            cx={POINTS[0].px}
            cy={POINTS[0].py}
            r={7}
            fill="#94a3b8"
            stroke="white"
            strokeWidth={2}
            filter="url(#ppc-dot-glow)"
          />

          <text
            ref={labelRef}
            x={POINTS[0].px}
            y={POINTS[0].py - 14}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={12}
            fontWeight={700}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {formatter.format(0)}
          </text>

          <text
            ref={overrunRef}
            x={POINTS[0].px}
            y={Math.min(PAD.t + INNER_H - 4, POINTS[0].py + 22)}
            textAnchor="middle"
            fill="rgb(148 163 184)"
            fontSize={11}
            fontWeight={700}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {`${t(`${P}.deltaPrefix`)}[${formatter.format(0)}]`}
          </text>

          <text x={PAD.l} y={PAD.t + INNER_H + 22} fill="rgb(148 163 184)" fontSize={11} fontFamily="ui-sans-serif, system-ui, sans-serif">
            {t(`${P}.monthStart`)}
          </text>
          <text
            x={W - PAD.r}
            y={PAD.t + INNER_H + 22}
            textAnchor="end"
            fill="rgb(148 163 184)"
            fontSize={11}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {t(`${P}.monthEnd`)}
          </text>
        </svg>
      </div>

      <div className="relative px-4 sm:px-5 pb-4 pt-2 border-t border-white/10 space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300/90">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-5 bg-slate-300/80 border-t border-dashed border-slate-300/80" />
            {t(`${P}.legendIdeal`)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[3px] w-5 rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400" />
            {t(`${P}.legendActual`)}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200/95 leading-relaxed m-0">
          <Trans
            i18nKey={`${P}.footer`}
            ns="landing"
            components={{ strong: <strong className="text-white" /> }}
          />
        </p>
      </div>
    </div>
  );
}
