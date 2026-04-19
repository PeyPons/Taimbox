# Informe de carga del equipo SEO (ene-mar 2026)

**Cliente / Agencia**: Coco Solution Worldwide  
**Periodo**: enero, febrero y marzo de 2026 (con contexto Q4 2025 → feb 2026 desde el cierre oficial)  
**Fuentes**:
- `taimbox-informe-coco-solution-2026-01_2026-04` (`burnout-by-employee.json` y `absences-events-feedback.json` por mes).
- Workbook `Informe Horas Clientes fin de mes .xlsx` (cierre mensual oficial; sept 2023 → feb 2026). **Aviso del cliente**: el sumatorio "Promedio de horas computadas" / "Total horas RRHH" está **mal**; las **horas reales por proyecto sí son fiables** y son las que se citan aquí.

**Scope SEO (análisis individual)**: Alexander Outeiral, Cristian Martinez, Eva Santana, Marta Ojeda, Miguel Ramirez, Raul Acosta, Raul Rivero.

**Scope PPC (apunte aclaratorio, fuera de análisis individual)**:
- **Tamia** — única persona PPC dedicada **a 40 h/sem**.
- **Alexander** — coordinación PPC + interlocución de cuentas grandes; sus horas PPC compiten con SEO técnico, Bioderma y Adislan.
- **No hay tercer perfil ejecutor** PPC. **Bus factor PPC = 1**.

---

## 1. Introduccion

Este informe esta enfocado **solo en carga de trabajo del equipo** y su relacion con:

- capacidad disponible mensual,
- ausencias registradas,
- carga comprometida (`committed load`),
- ocupacion resultante por persona y por equipo.

No entra en rentabilidad por cliente ni en cartera comercial, salvo cuando es necesario para contextualizar riesgo operativo.

---

## 2. Metodologia (resumen)

Para cada persona y mes se usan las metricas del export:

- **Capacidad calendario**: horas laborables del mes.
- **Ausencias**: reduccion de horas por vacaciones/baja/personal.
- **Capacidad neta**: calendario - ausencias.
- **Committed**: `max(plannerHoursMonthlyGrid, deadlineHoursTotal)`.
- **Ocupacion**: `committed / capacidad neta`.

### Lecturas importantes del dataset

- En **enero y febrero**, el `plannerHoursMonthlyGrid` aparece a `0` en este lote para el scope.
- En **marzo**, el planner si aparece cargado y empuja ocupaciones por encima del 100% en varios perfiles.
- El analisis individual y global refleja exactamente ese comportamiento.

---

## 3. Resumen ejecutivo de carga (equipo)

| Mes | Capacidad calendario | Ausencias | Capacidad neta | Committed | Ocupacion |
|-----|---------------------:|----------:|---------------:|----------:|----------:|
| Ene 2026 | 1.125,0 h | 68,5 h | 1.056,5 h | 849,5 h | 80,4 % |
| Feb 2026 | 1.026,0 h | 79,5 h | 946,5 h | 847,3 h | 89,5 % |
| Mar 2026 | 1.131,0 h | 84,5 h | 1.046,5 h | 1.078,9 h | **103,1 %** |

### Lectura directa

- El equipo pasa de carga comoda en enero a tension alta en febrero.
- Marzo entra en **sobrecarga agregada** (>100%).
- El salto de marzo se explica por planner ya cargado + volumen de trabajo comprometido.

---

## 4. Carga individual (enero-febrero-marzo)

## 4.1 Alexander Outeiral

| Mes | Cap. cal | Ausencias | Cap. neta | Committed | Ocupacion | Riesgo | Proyectos |
|-----|---------:|----------:|----------:|----------:|----------:|--------|----------:|
| Ene | 165,0 | 15,0 | 150,0 | 80,8 | 53,8 % | medium | 16 |
| Feb | 150,0 | 2,0 | 148,0 | 119,3 | 80,6 % | medium | 25 |
| Mar | 165,0 | 8,5 | 156,5 | 170,4 | **108,9 %** | high | 21 |
| **Total Q1** | **480,0** | **25,5** | **454,5** | **370,4** | **81,5 %** | — | — |

**Ausencias registradas**:
- 23/12/2025-04/01/2026 (vacaciones, tramo que impacta enero).
- 06/02 (baja, otorrino, 2 h).
- 03/03, 18/03, 25/03 (bajas puntuales, 8,5 h total en marzo).

---

## 4.2 Cristian Martinez

| Mes | Cap. cal | Ausencias | Cap. neta | Committed | Ocupacion | Riesgo | Proyectos |
|-----|---------:|----------:|----------:|----------:|----------:|--------|----------:|
| Ene | 165,0 | 0,0 | 165,0 | 137,8 | 83,5 % | medium | 35 |
| Feb | 150,0 | 7,5 | 142,5 | 131,0 | 91,9 % | medium | 32 |
| Mar | 165,0 | 0,0 | 165,0 | 172,1 | **104,3 %** | high | 39 |
| **Total Q1** | **480,0** | **7,5** | **472,5** | **440,9** | **93,3 %** | — | — |

**Ausencias registradas**:
- 16/02 (medico; reflejo en capacidad: 7,5 h en febrero).

---

## 4.3 Eva Santana

| Mes | Cap. cal | Ausencias | Cap. neta | Committed | Ocupacion | Riesgo | Proyectos |
|-----|---------:|----------:|----------:|----------:|----------:|--------|----------:|
| Ene | 166,0 | 40,0 | 126,0 | 98,5 | 78,2 % | medium | 17 |
| Feb | 152,0 | 70,0 | 82,0 | 71,5 | 87,2 % | medium | 15 |
| Mar | 168,0 | 0,0 | 168,0 | 161,2 | 95,9 % | medium | 23 |
| **Total Q1** | **486,0** | **110,0** | **376,0** | **331,2** | **88,1 %** | — | — |

**Ausencias registradas**:
- 05/01 (personal, 2 h).
- 25/01-12/02 (vacaciones largas, impacto fuerte en enero y febrero).

---

## 4.4 Marta Ojeda

| Mes | Cap. cal | Ausencias | Cap. neta | Committed | Ocupacion | Riesgo | Proyectos |
|-----|---------:|----------:|----------:|----------:|----------:|--------|----------:|
| Ene | 132,0 | 6,0 | 126,0 | 111,5 | 88,5 % | medium | 18 |
| Feb | 120,0 | 0,0 | 120,0 | 110,5 | 92,1 % | medium | 17 |
| Mar | 132,0 | 0,0 | 132,0 | 127,6 | 96,7 % | medium | 19 |
| **Total Q1** | **384,0** | **6,0** | **378,0** | **349,6** | **92,5 %** | — | — |

**Ausencias registradas**:
- 14/01 (baja puntual; impacto de 6 h en enero).

---

## 4.5 Miguel Ramirez

| Mes | Cap. cal | Ausencias | Cap. neta | Committed | Ocupacion | Riesgo | Proyectos |
|-----|---------:|----------:|----------:|----------:|----------:|--------|----------:|
| Ene | 166,0 | 0,0 | 166,0 | 145,5 | 87,7 % | medium | 24 |
| Feb | 152,0 | 0,0 | 152,0 | 142,5 | 93,8 % | medium | 25 |
| Mar | 168,0 | 76,0 | 92,0 | 88,7 | 96,4 % | medium | 20 |
| **Total Q1** | **486,0** | **76,0** | **410,0** | **376,7** | **91,9 %** | — | — |

**Ausencias registradas**:
- 16/03-29/03 (vacaciones; 76 h de reduccion de capacidad en marzo).

---

## 4.6 Raul Acosta

| Mes | Cap. cal | Ausencias | Cap. neta | Committed | Ocupacion | Riesgo | Proyectos |
|-----|---------:|----------:|----------:|----------:|----------:|--------|----------:|
| Ene | 165,0 | 7,5 | 157,5 | 140,0 | 88,9 % | medium | 22 |
| Feb | 150,0 | 0,0 | 150,0 | 139,0 | 92,7 % | medium | 22 |
| Mar | 165,0 | 0,0 | 165,0 | 190,7 | **115,6 %** | critical | 25 |
| **Total Q1** | **480,0** | **7,5** | **472,5** | **469,7** | **99,4 %** | — | — |

**Ausencias registradas**:
- 19/01 (baja puntual por operacion dental; 7,5 h en enero).

---

## 4.7 Raul Rivero

| Mes | Cap. cal | Ausencias | Cap. neta | Committed | Ocupacion | Riesgo | Proyectos |
|-----|---------:|----------:|----------:|----------:|----------:|--------|----------:|
| Ene | 166,0 | 0,0 | 166,0 | 135,5 | 81,6 % | medium | 23 |
| Feb | 152,0 | 0,0 | 152,0 | 133,5 | 87,8 % | medium | 27 |
| Mar | 168,0 | 0,0 | 168,0 | 168,2 | **100,1 %** | high | 30 |
| **Total Q1** | **486,0** | **0,0** | **486,0** | **437,2** | **90,0 %** | — | — |

**Ausencias registradas**:
- Sin ausencias cargadas en el periodo ene-mar.

---

## 5. Ausencias por persona (vision comparada)

> Estimacion de dias laborables equivalentes aproximados: `horas de ausencia / (jornada semanal / 5)`.

| Persona | Ausencias Q1 (h) | Dias equivalentes aprox. | Lectura |
|---------|-----------------:|-------------------------:|---------|
| Eva Santana | 110,0 | ~14,5 dias | Mayor impacto del trimestre |
| Miguel Ramirez | 76,0 | ~10,0 dias | Vacaciones concentradas en marzo |
| Alexander Outeiral | 25,5 | ~3,4 dias | Ausencias repartidas |
| Raul Acosta | 7,5 | ~1,0 dia | Baja puntual |
| Cristian Martinez | 7,5 | ~1,0 dia | Baja puntual |
| Marta Ojeda | 6,0 | ~1,0 dia | Baja puntual |
| Raul Rivero | 0,0 | ~0 dias | Sin reduccion por ausencia |

---

## 5.1 Hallazgos por mes en el cierre oficial (Excel "Informe Horas Clientes fin de mes")

> Esta seccion **complementa** la lectura de carga del equipo Taimbox con lo que el cliente cierra y firma cada mes. Solo se usan **horas reales por proyecto** (las **fiables** del Excel), nunca los sumatorios automaticos.

### 5.1.1 Por que mirar el cierre oficial mes a mes

Las metricas de carga (committed, ocupacion) reflejan **lo planificado y comprometido** en Taimbox. El **cierre mensual oficial** refleja **lo realmente facturado vs contratado** contra cliente. Cruzar ambas fuentes sirve para:

- Detectar **proyectos que erosionan capacidad** sin que se renegocien (sobreejecucion silenciosa).
- Detectar **bolsas infrautilizadas** que **bajan capacidad facturable**.
- Detectar **clientes nuevos** que entran **sin reforzar capacidad**.
- Confirmar que la tension del Q1 2026 **no es un evento aislado**, viene de Q4 2025.

### 5.1.2 SEO — patrones recurrentes Q4 2025 → Q1 2026

| Cliente / proyecto | Sep 25 | Oct 25 | Nov 25 | Ene 26 | Feb 26 | Lectura |
|---|---:|---:|---:|---:|---:|---|
| **DBS** (30 h) | 1,18× | 1,43× | 1,07× | 1,20× | 1,20× | **Sobreejecucion estructural**. |
| **Loro Parque SEO Mensual** (42 h) | 1,04× | 1,31× | 1,00× | 1,11× | 1,02× | Siempre por encima del piso. |
| **Hotel Botanico SEO** (44 h) | 1,00× | 1,15× | 1,00× | 1,00× | **1,19×** | Owner Acosta; tension ligada a su cuello de botella. |
| **Coco Marketing SEO Integral** (35 h, **interno**) | 1,00× | **2,08×** | 0,57× | **2,06×** | 1,00× | **Interno fuera de techo**. |
| **QuantumAssis** (10 h, **interno**) | 1,00× | **5,94×** | 1,99× | **2,76×** | 1,25× | **Interno fuera de control oct 25 y ene 26.** |
| **Limonada** (20 h) | 1,00× | 1,24× | 1,00× | 0,88× | **1,40×** | Volatil; necesita planning trimestral. |
| **HD Hotels SEO On Page** (20 h) | — | 1,00× | 1,21× | 1,00× | 0,80× | El cliente **mueve horas entre meses** (nota de feb 26: *"3 h de diciembre se computan en enero"*). |
| **Bolsa SEO Tecnico Holiday World** (8 h) | 0,53× | 0,69× | **0,225×** | 0,14× | 0,375× | **Bolsa muerta**: cerrar o pasar a horas a demanda. |
| **Off-page MyCarflix** (2 h) | 1,00× | 1,00× | **0** *(cambio dominio)* | 1,00× | 0,85× | Riesgo de no facturacion si la nueva web tarda. |
| **Email Marketing Loro Parque** (40 h) | — | 1,35× | 1,00× *(30 h)* | **— sin linea** | **— sin linea** | Confirmado: **bloque desaparecido desde enero 2026** → alivio operativo. |

**Lectura SEO:**

- **5 cuentas** generan **horas extra silenciosas todos los meses** (DBS, Loro Parque mensual, Hotel Botanico, Coco interno, QuantumAssis). Son la causa mas directa de la **erosion de buffer** del equipo.
- Los **proyectos internos** (Coco Marketing, QuantumAssis) **canibalizan capacidad facturable**. Son la **fuga silenciosa** mas grande del equipo SEO.
- **HD Hotels y enMarcha "compensan entre meses"**: rompe trazabilidad y **enmascara desviaciones**.

### 5.1.3 PPC — punto de inflexion en enero 2026

| Proyecto | Sep 25 | Oct 25 | Nov 25 | Ene 26 | Feb 26 | Lectura |
|---|---:|---:|---:|---:|---:|---|
| **SEM Domingo Alonso Ocasion** (4,5 h) | — | 0,63× | 0,67× | **4,43× (13,3 h)** | 1,90× | Salto brusco; nota: *"viendo como regular este desfase"*. |
| **Social Ads DA Ocasion** (4,5 h) | — | — | — | **3,23× (9,7 h)** | 1,56× | Reuniones largas para explicar diferencias **vs herramienta TWO**. |
| **SEM Banana Computer** (5 h) | 0,79× | 1,32× | 0,50× | **3,20×** | 1,32× | Propuesta interna: **pasar a contrato por horas** (sin decision aun). |
| **Social Ads Banana Computer** (2,9 h) | 0,97× | 1,07× | 1,03× | **2,77×** | 1,80× | Mismo patron. |
| **SEM Ducati Canarias** (5 h) | 0,83× | 1,00× | 0,50× | **3,36×** | 1,00× | Pico ene por *"informes extras y estrategia"*. |
| **SEM Holiday World Maspalomas** (1,67 h) | 0,96× | 1,00× | 0,30× | **4,20×** | **1,44×** | "Cliente estrellita" cronicamente over-budget por **fee minimo**. |
| **SEM HD Hotels** (5 h) | 1,34× | **1,65×** | 0,50× | 1,64× | 1,20× | Tension SEM todo el ano. |
| **SEM Bull Hotels** (7 h) | 0,98× | 1,00× | 0,50× | 1,34× | 1,24× | Feb 26: nota *"Tamia ha empezado a llevar esta cuenta"* → coste de **traspaso** Alexander → Tamia. |
| **SEM Coco Solution interno** (5 h) | 1,82× | 0,81× | 0,18× | 0,48× | **3,02× (15,1 h)** | Sin techo, igual que SEO interno. |
| **RRSS Electricas Centro** (12,86 h) | — | — | — | **alta enero (10,5 h)** | — | **Cliente nuevo**, fuera de cartera tradicional. |
| **RRSS Suisca Group** (10 h) | — | — | — | — | **alta febrero (10 h)** | **Cliente nuevo**. |
| **Park & Fly SEM/Social Ads** (4,5 h c/u) | — | — | — | (alta) | 1,1 / 0,1 | **Cliente nuevo Q1**, arranque tibio. |
| **Pop House SEM** (4,5 h) | — | — | 0,40× | 1,02× | 0,56× | Nuevo. |

**Lectura PPC:**

- **Noviembre 2025 → enero 2026** es el **punto de inflexion**: PPC pasa de **infrautilizar fees** (la mitad al ~50 %) a **desbordar 1,5×–4,4×** en menos de 60 dias.
- Coincide con **incorporacion de Tamia** y entrada de **clientes nuevos** (Electricas Centro, Suisca, Park & Fly, Pop House) **sin reforzar capacidad**.
- Las **notas internas** confirman que el equipo lo detecta (*"estamos viendo como regular esto"*, *"valorar contrato por horas en lugar de % de inversion"*) pero **no hay decision comercial cerrada**.
- Con **un solo perfil ejecutor (Tamia, 40 h/sem)** + **Alexander como cierre**, no hay margen para mas clientes nuevos sin renegociar la cartera actual.

### 5.1.4 Kit Digital — patron historico

| Proyecto | Sep 25 | Oct 25 | Nov 25 | Ene 26 | Feb 26 |
|---|---:|---:|---:|---:|---:|
| **KD Magma Consulting** (2 h) | — | — | — | **13,15× (26,3 h)** | 3,35× |
| **KD Nicolas Hernandez** (2 h) | — | — | 0,78× | 1,70× | 1,00× |
| **KD Furgomera** (2 h) | — | 0,50× | 0,93× | 1,10× | 1,00× |
| **KD IE Clinica Dental** (2 h) | 1,38× | 0,65× | 0,88× | 0,80× | 1,00× |
| **KD Three Stones** (2 h) | 1,00× | **1,80×** | — | 0,90× | 1,00× |
| **KD Hector Travis** (2 h) | — | — | — | — | 1,05× *(alta)* |
| **KD Rosa Verona** (2 h) | — | — | — | — | 1,00× *(alta)* |

**Lectura KD:**

- El producto KD a **2.000 €** prorrateado deberia consumir **~1,5 h/mes**. En la practica, **al menos 4 KD pasan de 2 h/mes** y **uno (Magma) llego a 26 h en un mes**.
- **Rotacion alta**: cada cierre entran o salen 1–2 KD. Sin **plantilla operativa cerrada** y **techo duro de horas**, la cartera KD seguira erosionando capacidad de **Cristian** (perfil que la concentra).

### 5.1.5 Clientes nuevos detectados Q4 2025 → Q1 2026

- **Capmedica Canarias** — alta oct 25, estable Q1 (~6–7 h/mes).
- **Loro Parque Fundacion** — On-page alta nov 25, estable Q1 (~12 h/mes).
- **Pop House (Pop Island)** — SEM/Social Ads alta nov 25 → operacion Q1.
- **Electricas Centro** — RRSS alta ene 26.
- **Suisca Group** — RRSS alta feb 26.
- **Park & Fly Las Palmas** — SEM + Social Ads alta ene 26.
- **Magma Coaching, Hector Travis, Rosa Verona, Furgomera, Glaseados, Nadina, Enredhadas, Ceballos Lopez** — carteras KD en **rotacion constante**.

### 5.1.6 Bolsas y servicios que pierden dinero

- **Bolsa SEO Tecnico Holiday World (8 h)** — infrautilizada 4 meses seguidos. **Cerrar o pasar a horas a demanda**.
- **Off-page MyCarflix** — pausado nov 25 (cambio de dominio). **Si la nueva web no entra, cero facturacion**.
- **Bolsa Email Marketing Coco Marketing (5 h)** — solo aparece en oct 25 (1,97×). **Servicio descontinuado** sin reemplazo claro.
- **Email Marketing Loro Parque (40 h)** — bloque **desaparecido desde enero 2026**. Alivio operativo confirmado; sostenibilidad del fee a revisar con comercial.

### 5.1.7 Que aporta este cierre oficial al diagnostico de carga

1. La **tension Q1 2026 no es un evento aislado**: viene de Q4 2025 con DBS, Loro Parque, Botanico, Coco interno y QuantumAssis siempre por encima del fee.
2. **Proyectos internos** (Coco Marketing SEO + QuantumAssis + SEM Coco interno) son la **mayor fuga silenciosa** de capacidad facturable del equipo.
3. **PPC se desborda en enero 2026** (entre 1,5× y 4,4×) **un mes y medio antes** del salto SEO de marzo. Es **early warning** estructural.
4. La cartera ha entrado **6 clientes nuevos** entre nov 25 y feb 26 **sin reforzar capacidad**. La sobrecarga de marzo 2026 (103,1 % agregado) es la **consecuencia mecanica** de ese acumulado.

---

## 6. Conclusiones de carga

1. **Marzo es el punto de ruptura del trimestre**: 103,1 % agregado del equipo.
2. **Raul Acosta** concentra el mayor nivel de tension sostenida (99,4 % en Q1 y pico 115,6 % en marzo).
3. **Cristian, Rivero y Alexander** cierran marzo en zona de riesgo alto por sobrecarga.
4. **Marta** no supera el 100 %, pero se mantiene en zona alta para su nivel de rol.
5. Las ausencias grandes (Eva y Miguel) no generan holgura real en el trimestre: el sistema absorbe bajadas de capacidad sin bajar suficiente committed.
6. **El cierre oficial mensual (§5.1) confirma** que la sobrecarga de Q1 **no es coyuntural**: viene de Q4 2025 y se ha alimentado de **proyectos internos sin techo** (Coco Marketing, QuantumAssis), **6 clientes nuevos** en cuatro meses y un **PPC que se desborda 1,5×–4,4×** sin refuerzo.
7. **PPC opera con bus factor = 1**: una baja de Tamia paraliza el bloque y obliga a Alexander a sustituir operacion (no solo cierre), sacrificando SEO tecnico y entregables.

---

## 7. Recomendaciones accionables (solo carga de equipo)

### 7.1 Inmediato (2-3 semanas)

- Fijar techo operativo temporal:
  - 95 % maximo para perfiles troncales.
  - 90 % para perfil junior/becaria.
- Congelar nuevas incorporaciones de trabajo en perfiles ya en rojo (Acosta, Cristian, Rivero/Alexander segun semana).
- Revisar semanalmente `committed vs net` por persona con semaforo simple (verde <85, ambar 85-95, rojo >95).

### 7.2 Corto plazo (30-45 dias)

- Rebalancear 25-35 h/mes desde perfiles en rojo hacia perfiles con margen relativo.
- Introducir reserva fija de capacidad para imprevistos (10-15 % equipo).
- Formalizar backup por persona critica para evitar que una ausencia descompense semanas completas.

### 7.3 Medio plazo (Q2)

- Reducir dispersion de proyectos por persona en picos (especialmente quienes estan por encima de 25-30 proyectos).
- Medir y limitar semanas consecutivas por encima del 95 %.
- Ajustar objetivos de committed por persona a su historico real de ausencias y capacidad neta.

### 7.4 Acciones especificas derivadas del cierre oficial (Excel)

- **Techo duro** a proyectos internos (Coco Marketing SEO Integral, QuantumAssis, SEM Coco Solution): **no superar el fee** sin firma explicita de direccion. Hoy son la **principal fuga** de capacidad facturable.
- **Renegociar fee** o **cerrar tope mensual** en cuentas con sobreejecucion estructural Q4 25 → Q1 26: **DBS, Loro Parque SEO Mensual, SEM HD Hotels, SEM Banana Computer, SEM Bull Hotels**.
- **Cerrar o convertir** la **bolsa SEO Tecnico Holiday World** (8 h infrautilizadas 4 meses).
- **Decision comercial** sobre PPC Banana Computer: pasar a **contrato por horas** vs % inversion (propuesta interna ya documentada en notas de cierre).
- **Tope KD**: maximo 10 KD por persona, ningun KD individual por encima de 2,5 h/mes sin escalado a comercial. Caso **Magma Consulting** (26,3 h en enero) **no debe repetirse**.
- **Refuerzo PPC**: incorporar al menos **un perfil junior PPC** de respaldo a Tamia para soportar los **clientes nuevos** que ya estan dentro (Suisca, Electricas Centro, Park & Fly, Pop House) **sin asfixiar** la operacion.
- **Auditoria mensual de "compensaciones entre meses"** (HD Hotels, enMarcha, Limonada): no permitir mover horas entre cierres sin justificar y trazar.

---

## 8. Estimaciones de carga (base historica ene-mar)

## 8.1 Estimacion por persona (promedio mensual base)

| Persona | Cap. cal media | Ausencias medias | Neto estimado | Committed medio | Ocupacion estimada |
|---------|---------------:|-----------------:|--------------:|----------------:|-------------------:|
| Raul Acosta | 160,0 | 2,5 | 157,5 | 156,6 | **99,4 %** |
| Cristian Martinez | 160,0 | 2,5 | 157,5 | 147,0 | 93,3 % |
| Marta Ojeda | 128,0 | 2,0 | 126,0 | 116,5 | 92,5 % |
| Miguel Ramirez | 162,0 | 25,3 | 136,7 | 125,6 | 91,9 % |
| Raul Rivero | 162,0 | 0,0 | 162,0 | 145,7 | 90,0 % |
| Eva Santana | 162,0 | 36,7 | 125,3 | 110,4 | 88,1 % |
| Alexander Outeiral | 160,0 | 8,5 | 151,5 | 123,5 | 81,5 % |

## 8.2 Estimacion de equipo (escenarios)

| Escenario mensual | Cap. neta estimada | Committed estimado | Ocupacion |
|-------------------|-------------------:|-------------------:|----------:|
| **Continuidad media Q1** | ~1.016,5 h | ~925,2 h | **~91,0 %** |
| **Mes tension tipo marzo** | ~1.016,5 h | ~1.078,9 h | **~106,1 %** |

### Lectura de estimaciones

- Si el equipo opera en media Q1, sigue en zona alta (90 %+), con poco margen real para imprevistos.
- Si se repite un mes tipo marzo, el sistema vuelve a sobracarga.
- Para sostener calidad y continuidad sin picos, objetivo recomendado: **bajar committed efectivo 8-12 %** o aumentar capacidad equivalente.

---

## 9. Cierre

Este informe confirma que la tension del equipo no es puntual: viene creciendo **desde Q4 2025** segun los cierres oficiales (§5.1) y se materializa en marzo 2026 con sobrecarga agregada del 103,1 %.

Tres palancas concretas para el siguiente trimestre, en orden de impacto:

1. **Control de committed por persona y por proyecto** (especialmente proyectos internos sin techo y cuentas estructuralmente over-budget identificadas en §5.1.2).
2. **Reserva de capacidad real** (10–15 % del equipo) y **plan de respaldo PPC** (eliminar bus factor = 1 sobre Tamia).
3. **Rebalanceo activo** entre perfiles en rojo y perfiles con margen relativo, con **techo duro** a la entrada de clientes nuevos hasta cerrar la deuda de capacidad acumulada Q4 25 → Q1 26.

Sin estas tres palancas, el siguiente pico (probable abril por el cierre de Eva el 24/04 + arrastre Q1) **se convierte en incumplimiento de entregables visible para cliente o en desgaste irreversible del equipo**.

