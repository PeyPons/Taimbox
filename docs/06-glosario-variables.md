## 6. Glosario de Variables y Términos Técnicos

| Término | Ubicación Común | Significado |
|:--- |:--- |:--- |
| `RLS` | Supabase / DB | Row Level Security. Filtra datos para que cada agencia solo vea los suyos. |
| `RBAC` | `usePermissions.ts` | Role-Based Access Control. Control de acceso por nombre de rol configurado. |
| `micros` | `sync-google-ads` (Edge Function) | Formato monetario de la API de Google Ads (1 unidad = 1.000.000 micros); la función convierte antes de guardar. |
| `slug` | `agencies` | Nombre único en la URL para identificar una agencia. |
| `weekStartsOn: 1` | `dateUtils.ts` | Configura el Lunes como primer día de la semana. |
| `hoursComputed` | `AppContext` | Horas finales validadas que impactan en la rentabilidad. |

---
