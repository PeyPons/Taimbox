import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Flame, Pause, Play } from 'lucide-react';

/**
 * Modelo conceptual: utilización vs margen neto.
 * Animación "tipo GIF": la curva crece de 0 → 100 %, un punto recorre el trazo
 * y un contador muestra el % actual. Bucle infinito con botón pausa/play.
 */

const W = 720;
const H = 340;
const PAD = { l: 52, r: 28, t: 36, b: 52 } as const;
const INNER_W = W - PAD.l - PAD.r;
const INNER_H = H - PAD.t - PAD.b;
const STEP = 0.5;
const SAMPLE_COUNT = Math.floor(100 / STEP) + 1;

const DURATION_DRAW_MS = 4500;
const PAUSE_END_MS = 2000;
const PAUSE_START_MS = 800;
const CYCLE_MS = PAUSE_START_MS + DURATION_DRAW_MS + PAUSE_END_MS;

function profitAtU(u: number): number {
  if (u <= 0) return -0.92;
  if (u <= 34) return -0.92 + (u / 34) * 0.92;
  if (u <= 72) return 0.96 * ((u - 34) / 38);
  if (u <= 80) return 0.96 - ((u - 72) / 8) * 0.08;
  if (u <= 85) return 0.88 - ((u - 80) / 5) * 0.36;
  if (u >= 100) return 0.52 - 1.3;
  const t = (u - 85) / 15;
  return 0.52 - 1.3 * t ** 1.8;
}

function xPos(u: number): number {
  return PAD.l + (u / 100) * INNER_W;
}

function yPos(p: number): number {
  return PAD.t + (INNER_H * (1 - p)) / 2;
}

function zoneColor(u: number): string {
  if (u >= 85) return '#ef4444';
  if (u >= 75) return '#f59e0b';
  if (u >= 50) return '#34d399';
  return '#94a3b8';
}

const FULL_POINTS: { px: number; py: number; u: number }[] = [];
for (let i = 0; i < SAMPLE_COUNT; i++) {
  const u = i * STEP;
  FULL_POINTS.push({ px: xPos(u), py: yPos(profitAtU(u)), u });
}

function buildPathD(upToIdx: number): string {
  const parts: string[] = [];
  for (let i = 0; i <= upToIdx; i++) {
    const { px, py } = FULL_POINTS[i];
    parts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return parts.join(' ');
}

const FULL_D = buildPathD(FULL_POINTS.length - 1);

export function OcupacionVsRentabilidadChart() {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<SVGTextElement>(null);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const pathEl = pathRef.current;
    const dotEl = dotRef.current;
    const labelEl = labelRef.current;
    if (!pathEl || !dotEl || !labelEl) return;

    let startTime: number | null = null;
    let elapsedAtPause = 0;
    let pausedLastFrame = false;

    const tick = (now: number) => {
      if (pausedRef.current) {
        if (!pausedLastFrame && startTime !== null) {
          elapsedAtPause = (now - startTime) % CYCLE_MS;
        }
        pausedLastFrame = true;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (pausedLastFrame || startTime === null) {
        startTime = now - elapsedAtPause;
        pausedLastFrame = false;
      }

      const elapsed = (now - startTime) % CYCLE_MS;

      let idx: number;
      let u: number;

      if (elapsed < PAUSE_START_MS) {
        idx = 0;
        u = 0;
      } else if (elapsed < PAUSE_START_MS + DURATION_DRAW_MS) {
        const drawT = (elapsed - PAUSE_START_MS) / DURATION_DRAW_MS;
        const eased = drawT < 0.5
          ? 2 * drawT * drawT
          : 1 - (-2 * drawT + 2) ** 2 / 2;
        idx = Math.round(eased * (FULL_POINTS.length - 1));
        u = idx * STEP;
      } else {
        idx = FULL_POINTS.length - 1;
        u = 100;
      }

      idx = Math.max(0, Math.min(FULL_POINTS.length - 1, idx));
      const pt = FULL_POINTS[idx];

      pathEl.setAttribute('d', buildPathD(idx));
      dotEl.setAttribute('cx', String(pt.px));
      dotEl.setAttribute('cy', String(pt.py));
      dotEl.style.fill = zoneColor(u);

      labelEl.setAttribute('x', String(pt.px));
      labelEl.setAttribute('y', String(pt.py - 14));
      labelEl.textContent = `${Math.round(u)}%`;
      labelEl.style.fill = zoneColor(u);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const yZero = yPos(0);
  const peakPx = xPos(72);
  const peakPy = yPos(profitAtU(72));
  const breakEvenX = xPos(34);
  const originY = yPos(profitAtU(0));

  return (
    <figure className="my-8 rounded-2xl border border-white/10 bg-slate-950 p-4 sm:p-6 overflow-x-auto shadow-lg shadow-black/20 relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[300px] h-auto"
        role="img"
        aria-labelledby="ocupacion-chart-title ocupacion-chart-desc"
      >
        <title id="ocupacion-chart-title">Utilización del equipo frente a rentabilidad (modelo conceptual)</title>
        <desc id="ocupacion-chart-desc">
          Curva animada que parte en negativo por costes fijos, cruza el equilibrio al 34%, alcanza el pico al 72%
          y se desploma a partir del 85%.
        </desc>

        {/* Zonas de fondo */}
        <rect x={xPos(0)} y={PAD.t} width={xPos(50) - xPos(0)} height={INNER_H} fill="rgb(15 23 42 / 0.55)" />
        <rect x={xPos(50)} y={PAD.t} width={xPos(75) - xPos(50)} height={INNER_H} fill="rgb(16 185 129 / 0.14)" />
        <rect x={xPos(75)} y={PAD.t} width={xPos(85) - xPos(75)} height={INNER_H} fill="rgb(245 158 11 / 0.12)" />
        <rect x={xPos(85)} y={PAD.t} width={xPos(100) - xPos(85)} height={INNER_H} fill="rgb(239 68 68 / 0.14)" />

        {/* Etiquetas de zona (sutiles, en la parte baja) */}
        <text x={(xPos(50) + xPos(75)) / 2} y={PAD.t + INNER_H - 8} textAnchor="middle" fill="rgb(52 211 153 / 0.5)" fontSize={10} fontFamily="system-ui, sans-serif">
          Saludable
        </text>
        <text x={(xPos(75) + xPos(85)) / 2} y={PAD.t + INNER_H - 8} textAnchor="middle" fill="rgb(245 158 11 / 0.5)" fontSize={10} fontFamily="system-ui, sans-serif">
          Fricción
        </text>
        <text x={(xPos(85) + xPos(100)) / 2} y={PAD.t + INNER_H - 8} textAnchor="middle" fill="rgb(239 68 68 / 0.5)" fontSize={10} fontFamily="system-ui, sans-serif">
          Colapso
        </text>

        {/* Línea break-even (0) */}
        <line x1={PAD.l} y1={yZero} x2={W - PAD.r} y2={yZero} stroke="rgb(148 163 184 / 0.35)" strokeWidth={1} strokeDasharray="4 4" />
        <text x={W - PAD.r - 2} y={yZero - 5} textAnchor="end" fill="rgb(148 163 184 / 0.8)" fontSize={10} fontFamily="system-ui, sans-serif">
          break-even
        </text>

        {/* Ejes */}
        <line x1={PAD.l} y1={PAD.t + INNER_H} x2={W - PAD.r} y2={PAD.t + INNER_H} stroke="rgb(255 255 255 / 0.22)" strokeWidth={1} />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + INNER_H} stroke="rgb(255 255 255 / 0.22)" strokeWidth={1} />

        <text x={W / 2} y={H - 10} textAnchor="middle" fill="rgb(199 210 254 / 0.85)" fontSize={12} fontFamily="system-ui, sans-serif">
          Tasa de utilización del equipo →
        </text>
        <text
          x={14}
          y={H / 2}
          textAnchor="middle"
          fill="rgb(199 210 254 / 0.85)"
          fontSize={12}
          fontFamily="system-ui, sans-serif"
          transform={`rotate(-90 14 ${H / 2})`}
        >
          Rentabilidad / margen neto →
        </text>

        {/* Marcador break-even ~34% */}
        <line x1={breakEvenX} y1={PAD.t + INNER_H} x2={breakEvenX} y2={yZero} stroke="rgb(94 234 212 / 0.3)" strokeWidth={1} />
        <text x={breakEvenX} y={PAD.t + INNER_H + 14} textAnchor="middle" fill="rgb(94 234 212 / 0.75)" fontSize={9} fontFamily="system-ui, sans-serif">
          ~34%
        </text>

        {/* Marcador pico estático (referencia sutil) */}
        <circle cx={peakPx} cy={peakPy} r={5} fill="rgb(52 211 153)" stroke="white" strokeWidth={1.2} opacity={0.35} />
        <text x={peakPx + 10} y={peakPy - 8} fill="rgb(167 243 208 / 0.5)" fontSize={10} fontFamily="system-ui, sans-serif">
          Pico ~72%
        </text>

        {/* Origen negativo */}
        <circle cx={xPos(0)} cy={originY} r={3.5} fill="rgb(248 113 113 / 0.8)" stroke="white" strokeWidth={1} />
        <text x={xPos(1.5)} y={originY + 16} fill="rgb(252 165 165 / 0.75)" fontSize={9} fontFamily="system-ui, sans-serif">
          Coste fijo
        </text>

        {/* Curva animada */}
        <path
          ref={pathRef}
          d={`M${FULL_POINTS[0].px.toFixed(1)} ${FULL_POINTS[0].py.toFixed(1)}`}
          fill="none"
          stroke="rgb(52 211 153)"
          strokeWidth={2.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Punto móvil */}
        <circle
          ref={dotRef}
          cx={FULL_POINTS[0].px}
          cy={FULL_POINTS[0].py}
          r={6}
          fill="#94a3b8"
          stroke="white"
          strokeWidth={1.5}
          style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4))' }}
        />

        {/* Etiqueta % que sigue al punto */}
        <text
          ref={labelRef}
          x={FULL_POINTS[0].px}
          y={FULL_POINTS[0].py - 14}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={13}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
        >
          0%
        </text>

        {/* Etiquetas eje X */}
        <text x={xPos(0)} y={H - 28} fill="rgb(148 163 184)" fontSize={10} fontFamily="system-ui, sans-serif">0%</text>
        <text x={xPos(50)} y={H - 28} textAnchor="middle" fill="rgb(148 163 184)" fontSize={10} fontFamily="system-ui, sans-serif">50%</text>
        <text x={xPos(100)} y={H - 28} textAnchor="end" fill="rgb(148 163 184)" fontSize={10} fontFamily="system-ui, sans-serif">100%</text>
      </svg>

      {/* Botón pausa / play */}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full bg-slate-800/80 border border-white/15 p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
        aria-label={paused ? 'Reanudar animación' : 'Pausar animación'}
      >
        {paused
          ? <Play className="h-4 w-4" aria-hidden />
          : <Pause className="h-4 w-4" aria-hidden />}
      </button>

      {/* Avisos siempre visibles */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 max-w-3xl mx-auto">
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-3 text-sm text-amber-50/90 leading-snug">
          <strong className="text-amber-200">Capacidad perdida por fragmentación:</strong>{' '}
          orden de magnitud de ~240.000 €/año en un equipo de 10 personas (modelo conceptual; varía por mix y tarifas).
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-950/25 px-3 py-3 text-sm text-red-50/90 leading-snug">
          <strong className="text-red-200">Sustituir un perfil quemado</strong> suele costar entre el 50% y el 200% de su salario anual —antes de contar el hueco operativo.
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-4 space-y-2.5 text-sm text-slate-200/90 max-w-3xl mx-auto">
        <div className="flex gap-3 items-start">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" aria-hidden />
          <p>
            <span className="text-emerald-300/90 font-medium">Rango saludable (50–75%):</span>{' '}
            Margen para imprevistos y Deep Work.
          </p>
        </div>
        <div className="flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden />
          <p>
            <span className="text-amber-200/90 font-medium">Zona de fricción (75–85%):</span>{' '}
            Pérdida de foco y fatiga cognitiva.
          </p>
        </div>
        <div className="flex gap-3 items-start">
          <Flame className="h-5 w-5 shrink-0 text-red-400 mt-0.5" aria-hidden />
          <p>
            <span className="text-red-300/90 font-medium">Colapso de margen (&gt;85%):</span>{' '}
            Burnout, retrabajo y rotación costosa.
          </p>
        </div>
      </div>

      <figcaption className="mt-4 text-xs sm:text-sm text-slate-400 text-center max-w-3xl mx-auto leading-relaxed border-t border-white/10 pt-3">
        Modelo conceptual basado en benchmarks del sector 2025-2026. La rentabilidad cae por encima del 85% porque el
        coste de fricción supera el ingreso marginal.
      </figcaption>
    </figure>
  );
}
