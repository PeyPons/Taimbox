# Informe operativo y financiero — Miguel Ramírez

**Periodo:** enero 2026 (mes civil)  
**Elaborado:** a partir del paquete de exportación Taimbox (ZIP / JSON), sin datos fuera del bundle.  
**Referencia de export:** `taimbox-informe-coco-solution-2026-01_2026-01` · `exportedAt` manifest ≈ `2026-04-18T13:55:59Z`

---

## 1. Ficha de persona

| Campo | Valor |
|--------|--------|
| Nombre | Miguel Ramírez |
| Email | mramirez@cocosolution.com |
| Rol | SEO |
| Departamento | seo |
| ID empleado | `37fccc06-3f32-459d-87b9-51318efe5559` |
| Activo | Sí |
| Capacidad semanal objetivo | 38 h |
| Horario (L–J / V) | 8 / 8 / 8 / 8 / 6 h (total 38 h) |
| Nómina mensual (config export) | 1.750 € |

---

## 2. Capacidad y disponibilidad en enero

| Concepto | Horas | Fuente lógica |
|----------|-------|----------------|
| Capacidad por calendario | **166** | Suma diaria según `workSchedule` |
| Reducción por ausencias | **0** | Sin ausencias registradas para Miguel en enero |
| Reducción por eventos de equipo | **16** | Año nuevo (8 h) + Reyes (8 h); incluido en `team_events` |
| **Disponible neto** | **150** | 166 − 0 − 16 |

**Conclusión:** el “disponible” del informe **cuadra** con la tarjeta tipo Deadlines (base − festivos − ausencias).

---

## 3. Carga: planificador vs Deadlines

| Métrica | Valor |
|---------|--------|
| Horas planificador (cuadrícula mensual) | **143,93** |
| Horas efectivas / métricas (mismo corte) | **143,93** |
| Cupos cliente (suma deadlines) | **136** |
| Gestiones globales (internas) | **9,5** |
| **Total Deadlines (cliente + globales)** | **145,5** |
| **Carga comprometida** (`max(planif., deadlines)`) | **145,5** |
| Delta \|planif. − deadlines\| | **1,57** |

**Ocupación sobre disponible neto:** 145,5 / 150 ≈ **97%**.  
**Buffer residual:** ≈ **4,5 h** (~**3%** del disponible).  
**Riesgo agregado (heurística export):** `medium`.

**Lectura:** el techo lo marca el **compromiso en Deadlines**, no un planificador descolgado; la diferencia con la cuadrícula es **pequeña** y coherente con una ligera holgura o tareas aún no reflejadas al nivel del cupo.

---

## 4. Gestiones globales Deadlines (internas)

| Concepto | Horas |
|----------|--------|
| Reuniones internas | 2 |
| Viernes colosal | 1 |
| Timeboxing y weeklys | 4 |
| Deadline | 2,5 |
| **Total** | **9,5** |

*(Incluidas en el total 145,5 h; no duplicar.)*

---

## 5. Deadlines por proyecto (24 cuentas · 136 h cliente)

Orden decreciente por horas asignadas a Miguel.

| # | h | Proyecto | Cliente |
|---|-----|----------|---------|
| 1 | 12 | SEO Mensual [VillaGranCanaria] | Villa Gran Canaria Investments SL |
| 2 | 11 | SEO Mensual [Limonada] | VALVERDE NORAMBUENA SPA |
| 3 | 9 | Migración K-TUIN | Entregables |
| 4 | 8 | SEO Mensual (ES/DE/EN) [Poema del Mar] | Poema Del Mar S.A. |
| 5 | 8 | Gestión Mensual SEO [Hotel Botánico] | Inserhotel SL |
| 6 | 8 | Seo On-Page [Abuelos Plus] | Abuelos Plus SL |
| 7 | 8 | SEO Integral [Coco Marketing] | Coco Solution (cliente) |
| 8 | 7 | SEO Mensual [VW Canarias Turismo y Comerciales] | Domingo Alonso S. L. U. |
| 9 | 6 | SEO Mensual [Loro Parque] | Loro Parque S.A. |
| 10 | 6 | SEO Mensual [myCarflix] | EFFICIENCY CARS SLU |
| 11 | 5 | SEO On-page [Skoda Canarias] | Domingo Alonso S. L. U. |
| 12 | 5 | SEO Mensual [Hyundai Canarias] | CORAUTO CANARIAS SL (Hyundai) |
| 13 | 5 | SEO Mensual [Hoteles Dunas & Resorts] | Dunas Resorts SL |
| 14 | 5 | SEO On-page [Xtravans] | BECARFLEX SL |
| 15 | 4 | SEO Mensual [100% Print] | INVERSIONES CIENPORCIENTOFOTOS SL |
| 16 | 4 | SEO Mensual [Hosticasa] | Hosticasa SLU |
| 17 | 4 | SEO On-page [Audi Canarias] | Domingo Alonso S. L. U. |
| 18 | 4 | SEO Content [enMarcha] (Portal Unificado) | Domingo Alonso S. L. U. |
| 19 | 4 | SEO Mensual [Capmédica] | Capmédica Canarias SL |
| 20 | 4 | SEO Content [Banana Computer] | BANANA COMPUTER SL |
| 21 | 3,5 | SEO On-page [Gran Farmacia Online] | JOSE R. CARDENES NAVARRO |
| 22 | 2,5 | SEO On-page [Domingo Alonso Ocasión] | Domingo Alonso S. L. U. |
| 23 | 1,5 | (KD) Proyecto SEO avanzado [Hector Travis] | Hector Antonio Marcos Rodriguez |
| 24 | 1,5 | (KD) Proyecto SEO avanzado Cristina Pisando Colores | Cristina Hernández Álamo |

**Suma:** 136 h · **24** proyectos → **media ~5,7 h/proyecto** (alta fragmentación operativa).

---

## 6. Planificación (allocations enero)

Del archivo por empleado del export:

- **Número de filas de planificación:** **71** allocations en el mes.
- Las horas de cabecera mensual (**143,93 h**) son la referencia alineada con el planificador; no coinciden con la suma cruda de `hoursAssigned` de todas las filas (criterio distinto para tareas completadas vs planificadas).

---

## 7. Rentabilidad (diagnóstico JSON, enero)

Parámetros del manifest del ZIP: horas **actual**, coste **standard**.

| Concepto | Valor |
|----------|--------|
| Horas reales atribuibles | **140,93** |
| Horas computadas | **143,93** |
| Ingresos atribuidos | **9.312,92 €** (aprox.) |
| Coste total | **8.396,39 €** (aprox.) |
| **Margen** | **916,53 €** (aprox.) |
| **Margen %** | **9,84%** |

**Nota:** el detalle `byProject` incluye líneas muy negativas (p. ej. imputaciones a **Gestiones internas** o ciertos **KD**) que conviene revisar aparte (precio, alcance, reparto de overhead). El agregado del mes sigue siendo **positivo**.

---

## 8. Ausencias, eventos y feedback

- **Ausencias enero:** ninguna registrada para Miguel.
- **Eventos:** Año nuevo y Reyes (ya reflejados en las 16 h).
- **Feedback semanal:** sin entradas para Miguel en el bloque de enero del export analizado.

---

## 9. Síntesis ejecutiva

1. **Datos coherentes:** disponible **150 h**, planificador **143,93 h**, Deadlines+globales **145,5 h**, ocupación **~97%** — el informe es **utilizable** para seguimiento y para análisis de saturación.
2. **Riesgo principal:** no es solo el volumen bruto sino la **dispersión en 24 cuentas** y un **buffer bajo (~3%)** para imprevistos.
3. **Finanzas:** margen mensual **positivo (~9,8%)** con matices en proyectos concretos que merecen revisión de imputación y rentabilidad por cuenta.

---

*Documento generado como artefacto de ejemplo a partir del export; si el código o los datos en producción cambian, regenerar el ZIP y sustituir cifras.*
