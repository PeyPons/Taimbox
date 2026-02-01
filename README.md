# Timeboxing

Sistema avanzado de gestión de recursos, planificación de agencias y seguimiento de presupuestos de marketing.

## 📚 Documentación Técnica (Exhaustiva)

Para una comprensión profunda de la arquitectura, variables, lógica de negocio y estructura del código, consulte el documento principal:

👉 **[DOCUMENTACION.md](./DOCUMENTACION.md)** (Versión en Español)

### Contenidos destacados en la documentación:
- **Glosario de Entidades**: Detalle de variables y tipos de datos.
- **Algoritmos Críticos**: Gestión de capacidad, ausencias y semanas partidas.
- **Integraciones**: Funcionamiento de los workers de Google y Meta Ads.
- **Estado Global**: Guía sobre Context API y patrones de carga.

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- Proyecto Supabase configurado

### Instalación
```bash
npm install
```

### Ejecución
```bash
# Frontend
npm run dev

# Sincronizadores de Ads (Node.js)
node ads-worker.js
node meta-worker.js
```
