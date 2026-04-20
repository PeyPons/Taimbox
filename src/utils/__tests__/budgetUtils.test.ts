import { parseISO } from 'date-fns';
import { getEffectiveBudget, getEffectiveMinimum, getEffectiveMonthlyFee } from '@/utils/budgetUtils';
import { PROJECT_TYPE_ENTREGABLE } from '@/config/projectTypePresets';

describe('getEffectiveMonthlyFee', () => {
  it('usa monthlyFee para tipos que no son Entregable', () => {
    const month = parseISO('2026-01-15');
    expect(getEffectiveMonthlyFee({ monthlyFee: 1000, projectType: 'Mensual' }, month)).toBe(1000);
  });

  it('entregable sin fechas completas usa monthlyFee', () => {
    const month = parseISO('2026-01-01');
    expect(
      getEffectiveMonthlyFee(
        {
          monthlyFee: 800,
          projectType: PROJECT_TYPE_ENTREGABLE,
          deliverableStartDate: '2026-01-01',
          deliverableDueDate: '',
        },
        month
      )
    ).toBe(800);
  });

  it('entregable con fase contenida en un mes asigna el total a ese mes', () => {
    const jan = parseISO('2026-01-01');
    const feb = parseISO('2026-02-01');
    const project = {
      monthlyFee: 0,
      projectType: PROJECT_TYPE_ENTREGABLE,
      deliverableContractFee: 3100,
      deliverableStartDate: '2026-01-01',
      deliverableDueDate: '2026-01-31',
    };
    expect(getEffectiveMonthlyFee(project, jan)).toBe(3100);
    expect(getEffectiveMonthlyFee(project, feb)).toBe(0);
  });

  it('sin deliverableContractFee usa monthlyFee como total del contrato', () => {
    const jan = parseISO('2026-01-01');
    expect(
      getEffectiveMonthlyFee(
        {
          monthlyFee: 3000,
          projectType: PROJECT_TYPE_ENTREGABLE,
          deliverableStartDate: '2026-01-01',
          deliverableDueDate: '2026-01-31',
        },
        jan
      )
    ).toBe(3000);
  });

  it('entregable con fin antes de inicio cae a monthlyFee', () => {
    const jan = parseISO('2026-01-01');
    expect(
      getEffectiveMonthlyFee(
        {
          monthlyFee: 400,
          projectType: PROJECT_TYPE_ENTREGABLE,
          deliverableStartDate: '2026-02-01',
          deliverableDueDate: '2026-01-15',
        },
        jan
      )
    ).toBe(400);
  });

  it('deliverableContractFee negativo o no finito ignora el override y usa monthlyFee como total', () => {
    const jan = parseISO('2026-01-01');
    const base = {
      monthlyFee: 2000,
      projectType: PROJECT_TYPE_ENTREGABLE,
      deliverableStartDate: '2026-01-01',
      deliverableDueDate: '2026-01-31',
    };
    expect(getEffectiveMonthlyFee({ ...base, deliverableContractFee: -100 }, jan)).toBe(2000);
    expect(getEffectiveMonthlyFee({ ...base, deliverableContractFee: Number.NaN }, jan)).toBe(2000);
  });

  it('entregable con fase en varios meses prorratea por días de calendario', () => {
    const jan = parseISO('2026-01-01');
    const feb = parseISO('2026-02-01');
    const project = {
      monthlyFee: 0,
      projectType: PROJECT_TYPE_ENTREGABLE,
      deliverableContractFee: 3100,
      deliverableStartDate: '2026-01-15',
      deliverableDueDate: '2026-02-14',
    };
    // Fase 31 días: 17 en enero, 14 en febrero.
    expect(getEffectiveMonthlyFee(project, jan)).toBeCloseTo((3100 * 17) / 31, 1);
    expect(getEffectiveMonthlyFee(project, feb)).toBeCloseTo((3100 * 14) / 31, 1);
  });
});

describe('getEffectiveBudget', () => {
  it('usa budgetOverride del deadline si existe', () => {
    expect(getEffectiveBudget({ budgetHours: 40 }, { budgetOverride: 28 })).toBe(28);
  });

  it('usa budgetHours del proyecto si no hay override', () => {
    expect(getEffectiveBudget({ budgetHours: 40 }, undefined)).toBe(40);
  });
});

describe('getEffectiveMinimum', () => {
  it('limita minimum al override cuando hay budgetOverride', () => {
    expect(getEffectiveMinimum({ budgetHours: 40, minimumHours: 30 }, { budgetOverride: 20 })).toBe(20);
  });
});
