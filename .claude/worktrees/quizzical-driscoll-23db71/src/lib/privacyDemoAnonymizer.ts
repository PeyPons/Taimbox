/**
 * Generador estable de etiquetas semánticas para modo demostración (misma agencia = mismas etiquetas por id).
 */
const SECTORS = [
  'Retail',
  'Tecnología',
  'Ecommerce',
  'Servicios',
  'Automoción',
  'Salud',
  'Inmobiliaria',
  'Educación',
  'Hostelería',
  'Moda',
];
const PREFIXES = ['Cliente', 'Cuenta', 'Proyecto', 'Ecommerce Internacional'];

export interface PrivacyAnonymizer {
  account: (id: string) => string;
  campaign: (id: string) => string;
  employee: (id: string) => string;
  project: (id: string) => string;
  task: (id: string) => string;
  /** Nombre de departamento / área (id estable, p. ej. empleadoId + nombre) */
  department: (id: string) => string;
}

export function createPrivacyAnonymizer(): PrivacyAnonymizer {
  const accountMap = new Map<string, string>();
  const campaignMap = new Map<string, string>();
  const employeeMap = new Map<string, string>();
  const projectMap = new Map<string, string>();
  const taskMap = new Map<string, string>();
  const departmentMap = new Map<string, string>();
  let accountIdx = 0;
  let campaignIdx = 0;
  let employeeIdx = 0;
  let projectIdx = 0;
  let taskIdx = 0;
  let departmentIdx = 0;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return {
    account: (id: string) => {
      if (!accountMap.has(id)) {
        accountIdx++;
        const sector = SECTORS[(accountIdx - 1) % SECTORS.length];
        const letter = letters[(accountIdx - 1) % 26];
        if (accountIdx <= 10) {
          accountMap.set(id, `Cliente ${letter} - ${sector}`);
        } else {
          const prefix = PREFIXES[(accountIdx - 1) % PREFIXES.length];
          accountMap.set(id, `${prefix} ${String(accountIdx).padStart(2, '0')}`);
        }
      }
      return accountMap.get(id)!;
    },
    campaign: (id: string) => {
      if (!campaignMap.has(id)) {
        campaignIdx++;
        const sector = SECTORS[(campaignIdx - 1) % SECTORS.length];
        campaignMap.set(id, `Campaña ${sector} ${String(campaignIdx).padStart(2, '0')}`);
      }
      return campaignMap.get(id)!;
    },
    employee: (id: string) => {
      if (!employeeMap.has(id)) {
        employeeIdx++;
        const sector = SECTORS[(employeeIdx - 1) % SECTORS.length];
        const letter = letters[(employeeIdx - 1) % 26];
        employeeMap.set(id, `Colaborador ${letter} - ${sector}`);
      }
      return employeeMap.get(id)!;
    },
    project: (id: string) => {
      if (!projectMap.has(id)) {
        projectIdx++;
        const sector = SECTORS[(projectIdx - 1) % SECTORS.length];
        projectMap.set(id, `Iniciativa ${sector} ${String(projectIdx).padStart(2, '0')}`);
      }
      return projectMap.get(id)!;
    },
    task: (id: string) => {
      if (!taskMap.has(id)) {
        taskIdx++;
        taskMap.set(id, `Entregable ${String(taskIdx).padStart(2, '0')}`);
      }
      return taskMap.get(id)!;
    },
    department: (id: string) => {
      if (!departmentMap.has(id)) {
        departmentIdx++;
        const sector = SECTORS[(departmentIdx - 1) % SECTORS.length];
        departmentMap.set(id, `Área ${sector} ${String(departmentIdx).padStart(2, '0')}`);
      }
      return departmentMap.get(id)!;
    },
  };
}
