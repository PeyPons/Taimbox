/**
 * Parches editoriales: párrafos cortos → bloques desarrollados.
 * Genera supabase/migrations/20260604120000_blog_expand_short_paragraphs.sql
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {Record<string, { es: Record<string, string>; en: Record<string, string> }>} */
export const PATCHES = {
  "estimacion-proyectos-agencia-como-acertar": {
    es: {
      "intro-callout":
        "Este artículo no es un manual PMBOK ni un curso de certificación. Es lo que pasa en la trinchera cuando vendes horas, prometes fechas y el cliente responde «el viernes» — y operaciones descubre el miércoles que la «última landing» tardó el doble.",
      "s4-p1":
        "Un presupuesto sin contingencia no es planificación; es fe. El buffer no es «engordar el margen»: es provisionar la fricción normal de producir trabajo intelectual — revisiones creativas, esperas del cliente, coordinación entre departamentos y el imprevisto que siempre aparece cuando la semana ya está llena. Repartirlo por categoría (creativo, PM, esperas legales) evita el porcentaje opaco que nadie defiende en comité.",
      "s5-p1":
        "Ninguna fecha ni fee sale al cliente sin pasar este filtro. Comercial, operaciones y el lead del rol crítico en la misma mesa — aunque duela — porque cada uno ve un riesgo distinto: comercial el pitch, ops la capacidad real y el lead técnico lo que el briefing no dice. Si alguien falta, la estimación vuelve a ser una corazonada con PowerPoint.",
      "s32-p1":
        "Cuando el encargo es nuevo o híbrido, descompón en entregables atómicos: investigación, wireframes, producción por rol (copy, arte, dev), QA, handoff. Cada pieza la estima quien la ejecuta; suma por fase y rol. Para de descomponer cuando cada bloque tenga dueño, definición de «hecho» y menos de dos días de esfuerzo — si sigues bajando, acabas con un WBS que nadie mantiene.",
      "s33-p1":
        "Plataforma nueva, API de terceros, integración que nadie ha tocado: pide tres cifras — optimista (O), probable (P), pesimista (Pes) — y calcula el esfuerzo esperado: <strong>E = (O + 4P + Pes) / 6</strong>. Ejemplo rápido: O=16 h, P=24 h, Pes=40 h → E ≈ 26 h. Documenta el supuesto de cada cifra; si no, el PERT se convierte en tres opiniones sin responsable.",
      "s6-p2":
        "Desviación (%) = ((horas reales − horas estimadas) / horas estimadas) × 100. Alerta de dirección: desviación media <strong>&gt; 20&nbsp;%</strong> en una tipología = pricing obsoleto, no «equipo lento». Revisa cada trimestre por tipo de encargo (landing, retainer, campaña paid) y ajusta tarifas o buffers antes de que el verde del pacing te mienta otra vez.",
      "s6-p3":
        "El bucle solo mejora si alguien mira los números con regularidad. El KPI en detalle está en <a href=\"/blog/kpis-agencias-marketing-2026\">KPIs para agencias de marketing</a>; la plantilla Excel con pacing y margen estimado, en <a href=\"/blog/plantilla-planificacion-recursos-agencia\">plantilla de planificación de recursos</a>. Si ya tienes desviación sistemática, el origen suele estar en la venta — lo desglosamos en este mismo blog sobre estimación y en <a href=\"/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas\">rentabilidad por proyecto</a>.",
    },
    en: {
      "intro-callout":
        "This is not a PMBOK manual or a certification course. It is what happens on the ground when you sell hours, promise dates, and the client says \"Friday\" — while ops discovers on Wednesday that the \"last landing page\" took twice as long.",
      "s4-p1":
        "A budget with no contingency is not planning; it is wishful thinking. A buffer is not \"padding the margin\": it provisions for the normal friction of intellectual work — creative rounds, client waits, cross-department coordination, and the surprise that always lands when the week is already full. Split it by category (creative, PM, legal waits) instead of a opaque percentage nobody defends in a steering meeting.",
      "s5-p1":
        "No date or fee goes to the client without passing this filter. Sales, ops, and the critical-role lead in the same room — even when it hurts — because each sees a different risk: sales the pitch, ops real capacity, and the technical lead what the brief does not say. If someone is missing, the estimate becomes a PowerPoint guess again.",
      "s32-p1":
        "When the engagement is new or hybrid, break it into atomic deliverables: research, wireframes, production by role (copy, art, dev), QA, handoff. Each piece is estimated by whoever executes it; sum by phase and role. Stop decomposing when every block has an owner, a definition of done, and less than two days of effort — go further and you end up with a WBS nobody maintains.",
      "s33-p1":
        "New platform, third-party API, integration nobody has touched: ask for three figures — optimistic (O), most likely (P), pessimistic (Pes) — and compute expected effort: <strong>E = (O + 4P + Pes) / 6</strong>. Quick example: O=16 h, P=24 h, Pes=40 h → E ≈ 26 h. Document the assumption behind each number; otherwise PERT becomes three opinions with no owner.",
      "s6-p2":
        "Variance (%) = ((actual hours − estimated hours) / estimated hours) × 100. Leadership alert: average variance <strong>&gt; 20&nbsp;%</strong> on a project type = outdated pricing, not a \"slow team\". Review quarterly by engagement type (landing, retainer, paid campaign) and adjust fees or buffers before green pacing lies to you again.",
      "s6-p3":
        "The loop only improves if someone reviews the numbers regularly. The KPI in detail is in <a href=\"/en/blog/marketing-agency-kpis-2026\">marketing agency KPIs</a>; the Excel template with pacing and estimated margin is in the <a href=\"/en/blog/agency-resource-planning-template\">resource planning template</a>. If variance is systematic, the root cause is usually in sales — covered in this estimation guide and in <a href=\"/en/blog/measure-project-profitability-stop-selling-hours\">per-project profitability</a>.",
    },
  },
  "capacidad-calendario-vs-capacidad-productiva-equipo": {
    es: {
      "5d17ced3-dcc7-4e6f-a66c-2b05c3229d3f":
        "Este artículo está pensado para escanear y aplicar. Si solo puedes leer una parte hoy, entra por la checklist del punto 5 y vuelve luego al resto; si tu dolor es prometer fechas con el calendario al verde, empieza por el punto 2.",
      "1554cea9-d214-4238-b015-d3c99cf6c00a":
        "Antes de abrir otro tablero el lunes, toma cuatro decisiones visibles en la herramienta que ya usa el equipo. No hace falta reorganizar media empresa: hace falta que esas decisiones se vean en la misma vista donde luego negociáis plazos con clientes.",
      "328554bd-5fd0-4f2c-8f59-8356cc355e5c":
        "Usa esta checklist en 20 minutos cada lunes, con el mismo grupo que aprueba cargas. Si dos o más puntos salen en rojo, no necesitas motivación extra: necesitas bajar compromiso o subir colchón antes de que el viernes sea otra negociación de fechas.",
      "ef3a7587-15d3-4671-80f0-158f01e4dea1":
        "La idea no es controlar por controlar, sino detectar fricción antes de que se convierta en retrasos crónicos o desgaste del equipo. Lo notas cuando alguien deja de proponer mejoras en la reunión de seguimiento y solo pide «más tiempo».",
      "d424b80a-b2f5-41d7-8168-d24af809e142":
        "Si quieres profundizar, entra por el punto que más te está costando sostener en tu operación diaria: timeboxing si el problema es alcance sin límite, KPIs si necesitas números en comité, o la guía de carga si el equipo ya va al límite antes de que salte una fecha.",
      "f79b82db-0e85-4c20-8193-798360567531":
        "Cuando alguien diga «esto es demasiado proceso», devuelve una sola pregunta: ¿cuántas fechas movimos el último mes sin cambiar alcance? Esa cifra suele ordenar la conversación — y separa el ritual útil del papeleo que nadie mira.",
    },
    en: {
      "5d17ced3-dcc7-4e6f-a66c-2b05c3229d3f":
        "This article is meant to scan and apply. If you can only read one part today, start with the checklist in section 5 and come back to the rest; if your pain is promising dates on a green calendar, start with section 2.",
      "1554cea9-d214-4238-b015-d3c99cf6c00a":
        "Before opening another board on Monday, make four visible decisions in the tool your team already uses. You do not need to reorganize half the company — you need those decisions to show up in the same view where you later negotiate client deadlines.",
      "328554bd-5fd0-4f2c-8f59-8356cc355e5c":
        "Run this checklist for 20 minutes every Monday with the same group that approves workload. If two or more items are red, you do not need more motivation: you need to cut commitments or add buffer before Friday becomes another date negotiation.",
      "ef3a7587-15d3-4671-80f0-158f01e4dea1":
        "The point is not control for its own sake, but spotting friction before it becomes chronic delays or team burnout. You notice it when someone stops suggesting improvements in the status meeting and only asks for \"more time\".",
      "d424b80a-b2f5-41d7-8168-d24af809e142":
        "To go deeper, pick the thread that is hardest to sustain day to day: timeboxing if scope has no ceiling, KPIs if you need numbers in steering, or the workload guide if the team is already at the limit before a date slips.",
      "f79b82db-0e85-4c20-8193-798360567531":
        "When someone says \"this is too much process\", answer with one question: how many dates did we move last month without changing scope? That number usually settles the conversation — and separates useful ritual from paperwork nobody reads.",
    },
  },
  "que-es-timeboxing": {
    es: {
      "78bf1479-d675-41bb-a61c-db3bfe6e489e":
        "Es común confundirlos, pero hay una diferencia vital: reservar hueco en el calendario no implica cerrar la tarea cuando toca. El timeboxing añade techo de tiempo y entregable mínimo; sin eso, el bloque se llena de coordinación y el viernes sigue igual de roto.",
      "c5fad4aa-c0a3-46d1-869d-e2aa3addb277":
        "Esta metodología propone una <strong>inversión radical</strong> de cómo entendemos el trabajo tradicional: en lugar de dejar que la tarea decida cuánto dura, decides tú cuánto tiempo merece y qué debe quedar hecho cuando suene el cronómetro.",
      "215b3ff8-3c3b-434d-a7d2-88c2d1ca2c88":
        "Implica que <strong>debes detener tu trabajo obligatoriamente</strong> cuando suene el cronómetro. No es sadismo de productividad: es proteger el resto del día y forzar un corte claro entre «pulir detalles» y «entregar algo que sirva».",
      "07a75943-c901-44b6-be34-8ae13839c907":
        "El límite actúa como <strong>aviso o punto de control</strong>. Sabes que debes ir concluyendo, pero tienes margen para cerrar bien la tarea — útil cuando un borrador creativo necesita diez minutos más, no otras dos horas de perfeccionismo.",
      "7944d54a-f6f0-4083-aba4-466035d66f0f":
        "Al planificar tus cajas de tiempo el día anterior, eliminas la pregunta diaria de «¿qué hago ahora?». Tu cerebro simplemente ejecuta el plan — y dejas de regalar la mañana a decidir prioridades en lugar de avanzar entregables.",
      "7255198c-82bc-4756-a778-92e60f345d39":
        "Saber que tienes un tiempo limitado crea un sentido de urgencia positivo, obligando a tu cerebro a ignorar distracciones y concentrarse. En agencia se nota cuando por fin dejas de mirar Slack cada tres minutos porque la caja tiene nombre y fecha de caducidad.",
      "3570fe71-12a7-453a-91f7-0cc311cf8d8a":
        "Cada vez que terminas una «caja», tu cerebro libera dopamina, manteniéndote motivado para la siguiente tarea de la jornada. No es truco de gamificación barata: es ritmo visible en un día que, si no, se diluye en reuniones.",
      "918edd8a-141b-47c6-957d-ec6c5030102b":
        "Define cuánto durará la caja y qué debe estar terminado estrictamente al finalizar — no «avanzar en el proyecto», sino un artefacto concreto: borrador en viñetas, lista de riesgos, primer mockup en baja fidelidad.",
      "fdb333e3-7bd6-425a-b37d-26f2492a6142":
        "Reservar un espacio en el calendario (ej. «de 10:00 a 12:00 trabajaré en el proyecto X») protege el hueco, pero no garantiza entrega: sin objetivo de cierre, esas dos horas se comen con mensajes y «solo una cosa rápida».",
      "ec7f3933-54f7-43a1-92b7-978267b2a2b0":
        "Añade un límite estricto y un objetivo (ej. «a las 11:30, el borrador se da por concluido y paso a lo siguiente»). Ese corte es lo que convierte un bloque de calendario en capacidad productiva real.",
      "ec1f56bc-de33-4c65-b69a-6e3964a41335":
        "Dejar el tiempo al azar es dejar los beneficios al azar. Las agencias que operan con cajas visibles no trabajan más horas: deciden antes qué merece el foco y qué puede esperar al siguiente sprint.",
      "ba409868-10c1-4af1-8341-03c0d320f55c":
        "<strong>Cuándo usarlo:</strong> tareas propensas al perfeccionismo (diseño), investigación acotada o reuniones que, sin techo, se expanden hasta llenar la hora reservada.",
      "acf7148e-be24-4f82-80e0-6b336efc2eb9":
        "<strong>Cuándo usarlo:</strong> trabajos creativos complejos (redacción, programación) o entregas a clientes inamovibles donde un corte duro rompería calidad — pero igual necesitas un punto de control intermedio.",
      "27b30477-ae01-48a3-8701-e7dfe7b6ebbc":
        "<strong>El beneficio:</strong> cura el perfeccionismo tóxico y garantiza que el resto del día no sufra retrasos en cadena — porque el corte obliga a priorizar lo esencial dentro del timebox.",
    },
    en: {
      "78bf1479-d675-41bb-a61c-db3bfe6e489e":
        "People often confuse them, but the difference matters: blocking calendar time does not mean closing the task when time is up. Timeboxing adds a time ceiling and a minimum deliverable; without that, the block fills with coordination and Friday is still broken.",
      "c5fad4aa-c0a3-46d1-869d-e2aa3addb277":
        "This method is a <strong>radical inversion</strong> of how we usually treat work: instead of letting the task decide how long it takes, you decide how much time it deserves and what must be done when the timer stops.",
      "215b3ff8-3c3b-434d-a7d2-88c2d1ca2c88":
        "It means you <strong>must stop when the timer rings</strong>. That is not productivity cruelty: it protects the rest of the day and forces a clear cut between \"polishing details\" and \"shipping something useful\".",
      "07a75943-c901-44b6-be34-8ae13839c907":
        "The limit acts as a <strong>warning or checkpoint</strong>. You know you should wrap up, but you still have room to close the task properly — useful when a creative draft needs ten more minutes, not two more hours of perfectionism.",
      "7944d54a-f6f0-4083-aba4-466035d66f0f":
        "By planning your timeboxes the day before, you remove the daily \"what do I do now?\" question. Your brain just executes the plan — and you stop giving the morning away to prioritizing instead of moving deliverables.",
      "7255198c-82bc-4756-a778-92e60f345d39":
        "Knowing you have limited time creates positive urgency, pushing your brain to ignore distractions and focus. In agencies you feel it when you finally stop checking Slack every three minutes because the box has a name and an expiry time.",
      "3570fe71-12a7-453a-91f7-0cc311cf8d8a":
        "Every time you finish a \"box\", your brain releases dopamine, keeping you motivated for the next task. It is not cheap gamification: it is visible rhythm on a day that otherwise dissolves into meetings.",
      "918edd8a-141b-47c6-957d-ec6c5030102b":
        "Define how long the box lasts and what must be strictly finished at the end — not \"make progress on the project\", but a concrete artifact: bullet outline, risk list, first low-fi mockup.",
      "fdb333e3-7bd6-425a-b37d-26f2492a6142":
        "Blocking calendar time (e.g. \"10:00–12:00 I will work on project X\") protects the slot but does not guarantee delivery: without a closing objective, those two hours get eaten by messages and \"just one quick thing\".",
      "ec7f3933-54f7-43a1-92b7-978267b2a2b0":
        "Add a strict limit and an objective (e.g. \"at 11:30 the draft is done and I move on\"). That cut is what turns a calendar block into real productive capacity.",
      "ec1f56bc-de33-4c65-b69a-6e3964a41335":
        "Leaving time to chance is leaving outcomes to chance. Agencies that run visible boxes do not work more hours: they decide upfront what deserves focus and what can wait until the next sprint.",
      "ba409868-10c1-4af1-8341-03c0d320f55c":
        "<strong>When to use it:</strong> tasks prone to perfectionism (design), bounded research, or meetings that, without a ceiling, expand to fill the booked hour.",
      "acf7148e-be24-4f82-80e0-6b336efc2eb9":
        "<strong>When to use it:</strong> complex creative work (writing, coding) or immovable client deliveries where a hard stop would break quality — but you still need an intermediate checkpoint.",
      "27b30477-ae01-48a3-8701-e7dfe7b6ebbc":
        "<strong>The benefit:</strong> it curbs toxic perfectionism and keeps the rest of the day from slipping — because the forced stop makes you prioritize what matters inside the box.",
    },
  },
  "por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado": {
    es: {
      "41618a9b-b55b-4459-add5-1c3217bb0fb3":
        "La mayoría de mandos no lo hacen a propósito. Suele bastar con una combinación de hábitos que parecen inocuos: responder en segundos para demostrar servicio, decir que sí a «solo un cambio» sin ticket y medir orgullo por ocupación en lugar de margen.",
      "1f8ad26c-3d71-43c6-ba05-770a003a8673":
        "Pregunta incómoda: <em>¿cuántas bajas ha tenido tu agencia este año? ¿Ese coste aparece en algún dashboard?</em> Si la respuesta es no, estás financiando rotación con el mismo Excel que te dice que «vamos bien de horas».",
    },
    en: {
      "41618a9b-b55b-4459-add5-1c3217bb0fb3":
        "Most managers do not do it on purpose. A mix of habits that look harmless is usually enough: replying in seconds to prove service, saying yes to \"just one tweak\" with no ticket, and measuring pride by utilization instead of margin.",
      "1f8ad26c-3d71-43c6-ba05-770a003a8673":
        "Uncomfortable question: <em>how many people left your agency this year? Does that cost show up on any dashboard?</em> If the answer is no, you are funding turnover with the same spreadsheet that says \"we are fine on hours\".",
    },
  },
  "gestion-carga-trabajo-equipo-sin-burnout": {
    es: {
      "17e4a429-6610-4f80-adc8-aa3e8fee0dc5":
        "¿Cómo saber si el equipo va al límite antes de que alguien reviente? Mezcla intuición y números. Mucha gente no dice «no puedo»; deja de proponer, entrega más tarde con menos criterio y desaparece del canal cuando antes mandaba memes.",
      "b861e508-6faf-4c1c-b43d-05403d4181ab":
        "Si ya estás en fase de «equipo fundido», el peor error es restarle importancia con frases hechas. Hay que actuar a la vez en carga visible, prioridades explícitas y recuperación entre picos — no esperar al one-to-one de despedida.",
      "494e46a3-cc24-49cf-9c3b-bbf1fa77c7c7":
        "Si te ha picado el gusanillo de pasar de intuición a números que sirvan en comité, aquí van dos lecturas que suelen cerrar el círculo: KPIs accionables y la trampa de confundir ocupación con rentabilidad cuando el calendario está al verde.",
    },
    en: {
      "17e4a429-6610-4f80-adc8-aa3e8fee0dc5":
        "How do you know the team is at the limit before someone breaks? Mix intuition and numbers. Many people never say \"I can't\"; they stop proposing, deliver later with less judgment, and go quiet in the channel where they used to send GIFs.",
      "b861e508-6faf-4c1c-b43d-05403d4181ab":
        "If you are already in \"burnt-out team\" mode, the worst mistake is downplaying it with stock phrases. You need visible workload, explicit priorities, and recovery between peaks — not waiting for the exit one-to-one.",
      "494e46a3-cc24-49cf-9c3b-bbf1fa77c7c7":
        "If you want to move from gut feel to numbers that work in steering, two reads usually close the loop: actionable KPIs and the trap of confusing utilization with profitability when the calendar looks green.",
    },
  },
  "como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas": {
    es: {
      "156426d7-b65b-4f4e-b4c5-751a72ecde35":
        "<strong>Pros:</strong> Seguridad de cobro por cada minuto invertido — útil cuando el alcance es difuso y el cliente quiere transparencia hora a hora.",
      "a6dcdb4c-a381-435d-a8cf-ae2ed9bbe30b":
        "<strong>Pros:</strong> Predecibilidad de caja y relación a largo plazo — el cliente sabe cuánto paga al mes y tú puedes planificar capacidad con menos sorpresas en el comité.",
      "58feafac-b1a0-45fb-b52b-6be3972e24c5":
        "<strong>Contras:</strong> Todo el riesgo de desviación (scope creep) lo asume la agencia — si no hay protocolo de cambios, el fee cerrado se convierte en subsidio del cliente.",
      "d2995d6d-ec83-4d14-9e1d-42ad3e01fec7":
        "<strong>Pros:</strong> Claridad total para el cliente y premio a la eficiencia si tienes procesos finos — cuanto mejor ejecutas, más margen dejas en la mesa.",
      "f4c7efb5-ac88-441d-a99f-6604c8476055":
        "<strong>Contras:</strong> Penaliza la eficiencia y dificulta la previsión de ingresos para el cliente — además, incentiva picar horas en lugar de resolver el problema.",
      "c3e51fcc-8d3f-4fee-8ffb-4d9b6ebb2bfe":
        "<strong>Contras:</strong> Tendencia a la «comodidad» del cliente (pide de más) y a la «relajación» de la agencia (mide demasiado tarde) si no hay revisión de pacing cada semana.",
      "e9eaa7be-219c-41bb-963c-3a8f4c296007":
        "No esperes a que el Excel te avise de que no queda margen. La rentabilidad se construye decisión a decisión — en el SOW, en el ticket de cambio y en la conversación incómoda antes de decir que sí otra vez.",
    },
    en: {
      "156426d7-b65b-4f4e-b4c5-751a72ecde35":
        "<strong>Pros:</strong> You get paid for every minute worked — useful when scope is fuzzy and the client wants hour-by-hour transparency.",
      "a6dcdb4c-a381-435d-a8cf-ae2ed9bbe30b":
        "<strong>Pros:</strong> Predictable cash flow and long-term relationships — the client knows the monthly fee and you can plan capacity with fewer surprises in steering.",
      "58feafac-b1a0-45fb-b52b-6be3972e24c5":
        "<strong>Contras:</strong> The agency carries all variance risk (scope creep) — without a change protocol, fixed fee becomes a client subsidy.",
      "d2995d6d-ec83-4d14-9e1d-42ad3e01fec7":
        "<strong>Pros:</strong> Total clarity for the client and a reward for efficiency when your processes are tight — the better you execute, the more margin you keep.",
      "f4c7efb5-ac88-441d-a99f-6604c8476055":
        "<strong>Contras:</strong> It punishes efficiency and makes revenue forecasting harder for the client — it also incentivizes logging hours instead of solving the problem.",
      "c3e51fcc-8d3f-4fee-8ffb-4d9b6ebb2bfe":
        "<strong>Contras:</strong> Client \"comfort\" (asking for more) and agency \"relaxation\" (measuring too late) if you skip weekly pacing reviews.",
      "e9eaa7be-219c-41bb-963c-3a8f4c296007":
        "Do not wait for Excel to tell you there is no margin left. Profitability is built decision by decision — in the SOW, in the change ticket, and in the uncomfortable conversation before you say yes again.",
    },
  },
  "planificacion-proyectos-cronograma-recursos": {
    es: {
      "5bb6c9d3-aac8-48dc-ac64-d574454e56b3":
        "Si quieres profundizar en la técnica, el hilo completo está en <a href=\"/blog/que-es-timeboxing\">qué es el timeboxing</a>: bloques con entregable, límite estricto y la inversión de «alcance fijo, tiempo variable».",
      "bad8b343-fd53-4ee9-a46b-80a346e85114":
        "Consulta <a href=\"/precios\">tarifas y planes concretos</a> si quieres comparar opciones antes de dar el salto desde Excel — no sustituye la plantilla, pero aclara qué incluye cada nivel.",
      "274e6ce3-6c71-43b1-b8fa-ea7239255bd7":
        "Cronograma, presupuesto y recursos en un solo lugar: cuando la asignación semanal y el margen dejan de vivir en hojas distintas, el comité deja de pelearse con versiones del Excel. Taimbox se puede explorar sin compromiso.",
      "84e9a995-02ea-420b-b499-9ec780431b9b":
        "Quién hace qué y con cuántas horas. Presupuesto por proyectos ligado a esas horas y reportes de margen (asignado vs. real) en el mismo flujo — ahí es donde deja de ser «planificación teórica» y pasa a ser conversación de negocio.",
      "c36c5b4f-d0ab-4ff6-95aa-94aec6b2f4f9":
        "Estado de tareas, flujo de trabajo, dependencias y plazos. No suelen mostrar capacidad ni horas por persona ni margen por proyecto — útiles para ejecutar, insuficientes para prometer fechas con datos.",
    },
    en: {
      "5bb6c9d3-aac8-48dc-ac64-d574454e56b3":
        "To go deeper on the technique, the full thread is in <a href=\"/en/blog/what-is-timeboxing\">what is timeboxing</a>: boxes with a deliverable, a strict limit, and the inversion of \"fixed scope, variable time\".",
      "bad8b343-fd53-4ee9-a46b-80a346e85114":
        "See <a href=\"/en/pricing\">concrete pricing and plans</a> if you want to compare options before moving on from Excel — it does not replace the template, but clarifies what each tier includes.",
      "274e6ce3-6c71-43b1-b8fa-ea7239255bd7":
        "Schedule, budget, and resources in one place: when weekly allocation and margin stop living in separate sheets, steering stops fighting over Excel versions. You can explore Taimbox with no commitment.",
      "84e9a995-02ea-420b-b499-9ec780431b9b":
        "Who does what and for how many hours. Project budgets tied to those hours and margin reports (allocated vs. actual) in the same flow — that is where planning stops being theoretical and becomes a business conversation.",
      "c36c5b4f-d0ab-4ff6-95aa-94aec6b2f4f9":
        "Task status, workflow, dependencies, and deadlines. They rarely show capacity, hours per person, or margin per project — great for execution, not enough to promise dates with data.",
    },
  },
  "ley-parkinson": {
    es: {
      "3d7dbe02-de40-4a49-9ce5-84f3269493d8":
        "Los antídotos clásicos son timeboxing, plazos cortos y límites explícitos; en agencias, un planificador por horas y presupuesto visible evita que el trabajo se expanda en silencio hasta comerse el margen del trimestre.",
      "b074d816-7f89-46d8-9b14-47dd9e614cae":
        "En lugar de «entregar cuando puedas», define hitos concretos (ej. primer borrador en 2 días, revisión en 1 día). El trabajo deja de llenar el vacío del calendario porque cada tramo tiene techo y entregable.",
      "893654fe-11a2-4244-9d91-9a3633a7017f":
        "<em>Más abajo desarrollamos el resto del marco de Parkinson: origen burocrático, segunda ley financiera y ley de la trivialidad en reuniones — tres caras del mismo patrón de expansión sin límite.</em>",
      "2a38c315-c307-49b0-803c-514b9e442c38":
        "Planificación por horas, límites claros y margen a la vista; en Taimbox puedes probar ese flujo sin compromiso si ya reconoces la ley en tu operación diaria.",
      "3a0f20cd-a127-4c74-b3a0-cf9b80be8eae":
        "En agencias, en muchos estudios, plazos más cortos y claros se asocian a mejor foco y a que el trabajo no se dilate sin límite — siempre que el techo venga acompañado de entregable y no solo de presión.",
    },
    en: {
      "3d7dbe02-de40-4a49-9ce5-84f3269493d8":
        "Classic antidotes are timeboxing, short deadlines, and explicit limits; in agencies, hourly planning and visible budgets stop work from expanding quietly until it eats the quarter's margin.",
      "b074d816-7f89-46d8-9b14-47dd9e614cae":
        "Instead of \"deliver when you can\", set concrete milestones (e.g. first draft in 2 days, review in 1 day). Work stops filling the calendar void because each stretch has a ceiling and a deliverable.",
      "893654fe-11a2-4244-9d91-9a3633a7017f":
        "<em>Below we unpack the rest of Parkinson's frame: bureaucratic origin, the financial second law, and the law of triviality in meetings — three faces of the same pattern of expansion without limits.</em>",
      "2a38c315-c307-49b0-803c-514b9e442c38":
        "Hour-based planning, clear limits, and margin in sight; in Taimbox you can try that flow with no commitment if you already recognize the law in daily operations.",
      "3a0f20cd-a127-4c74-b3a0-cf9b80be8eae":
        "In agencies, many studies link shorter, clearer deadlines to better focus and work that does not expand without limits — as long as the ceiling comes with a deliverable, not pressure alone.",
    },
  },
  "kpis-agencias-marketing-2026": {
    es: {
      "60e9b0ef-914f-4bc0-acab-716498d4837b":
        "Capacidad y ritmo de proyectos en un solo flujo en <strong>Taimbox</strong>, para quien ya haya cerrado Excel los lunes y quiera que utilización, pacing y margen salgan del mismo sitio donde se asigna trabajo.",
    },
    en: {
      "60e9b0ef-914f-4bc0-acab-716498d4837b":
        "Capacity and project pacing in one flow in <strong>Taimbox</strong>, for teams who have outgrown Monday Excel and want utilization, pacing, and margin from the same place where work is assigned.",
    },
  },
  "plantilla-planificacion-recursos-agencia": {
    es: {
      "3745f219-1576-4595-9b35-d166e3a33d7c":
        "La plantilla funciona en Excel y en Google Sheets; las fórmulas son compatibles. La diferencia relevante es operativa: en Sheets el archivo vive en la nube y varios pueden editar a la vez — con el riesgo de romper una celda desprotegida si alguien no sigue el protocolo.",
      "9185705a-c44b-46b5-aa43-8d08b7df3827":
        "La plantilla viene con dos semanas de ejemplo (S12 y S13). Para añadir una nueva semana, duplica la columna de la semana anterior, actualiza la etiqueta en la fila de cabecera y comprueba que los SUMIF siguen apuntando al rango correcto antes de rellenar horas reales.",
      "6f902704-1141-47b9-ae1a-79dbcd9d2edf":
        "Capacidad, asignación, pacing y utilización sin mantener la hoja a mano cada lunes: cuando el modelo manual ya no escala, la misma lógica puede vivir en un planificador que actualice números al registrar horas. Taimbox se puede explorar sin compromiso.",
      "c55f3e84-e472-48e3-bdcb-cade3d49651e":
        "La plantilla aplica formato condicional nativo en la columna de utilización. Excel y Google Sheets lo interpretan directamente al importar el .xlsx — no hace falta reconfigurar reglas salvo que cambies los umbrales acordados con dirección.",
    },
    en: {
      "3745f219-1576-4595-9b35-d166e3a33d7c":
        "The template works in Excel and Google Sheets; formulas are compatible. The meaningful difference is operational: in Sheets the file lives in the cloud and several people can edit at once — with the risk of breaking an unprotected cell if someone skips the protocol.",
      "9185705a-c44b-46b5-aa43-8d08b7df3827":
        "The template ships with two sample weeks (S12 and S13). To add a new week, duplicate the previous week column, update the header label, and verify SUMIF ranges still point to the right cells before entering real hours.",
      "6f902704-1141-47b9-ae1a-79dbcd9d2edf":
        "Capacity, allocation, pacing, and utilization without rebuilding the sheet every Monday: when the manual model stops scaling, the same logic can live in a planner that updates numbers when hours are logged. You can explore Taimbox with no commitment.",
      "c55f3e84-e472-48e3-bdcb-cade3d49651e":
        "The template uses native conditional formatting on the utilization column. Excel and Google Sheets apply it when you import the .xlsx — you only need to reconfigure rules if you change the thresholds agreed with leadership.",
    },
  },
};

function sqlEscape(str) {
  return str.replace(/'/g, "''");
}

function buildPatchCase(patches) {
  const entries = Object.entries(patches);
  if (entries.length === 0) return "elem";
  const whens = entries
    .map(([id, html]) => `      WHEN elem->>'id' = '${sqlEscape(id)}' THEN jsonb_set(elem, '{html}', to_jsonb('${sqlEscape(html)}'::text))`)
    .join("\n");
  return `CASE\n${whens}\n      ELSE elem\n    END`;
}

function buildUpdate(slug, column, patches) {
  if (Object.keys(patches).length === 0) return "";
  const caseExpr = buildPatchCase(patches);
  return `
UPDATE public.blog_posts
SET ${column} = (
  SELECT COALESCE(
    jsonb_agg(
      ${caseExpr}
      ORDER BY ord
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(${column}) WITH ORDINALITY AS t(elem, ord)
)
WHERE slug = '${sqlEscape(slug)}';
`;
}

let sql = `-- Ampliación editorial de párrafos cortos en blog_posts (ES + EN).
-- Idempotente: reemplaza html de bloques concretos por id.

`;

for (const [slug, locales] of Object.entries(PATCHES)) {
  sql += `-- ${slug}\n`;
  sql += buildUpdate(slug, "blocks_es", locales.es);
  sql += buildUpdate(slug, "blocks_en", locales.en);
  sql += "\n";
}

const outPath = join(__dirname, "..", "supabase", "migrations", "20260604120000_blog_expand_short_paragraphs.sql");
writeFileSync(outPath, sql, "utf8");
console.log("Written:", outPath);
console.log("Slugs:", Object.keys(PATCHES).length);
