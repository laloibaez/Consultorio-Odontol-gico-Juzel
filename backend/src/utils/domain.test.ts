import test from 'node:test';
import assert from 'node:assert/strict';
import { checkHours, installmentAmounts, dueDate } from './domain.js';
test('Cuotas mantienen el total exacto en céntimos', () => {
  assert.deepEqual(installmentAmounts(100, 3), [33.34, 33.33, 33.33]);
});
test('Fin de mes se ajusta sin saltar febrero', () => {
  assert.equal(dueDate('2026-01-31', 1, 'mensual').toISOString().slice(0, 10), '2026-02-28');
  assert.equal(dueDate('2026-01-31', 2, 'mensual').toISOString().slice(0, 10), '2026-03-31');
});
test('Quincenas cruzan mes correctamente', () => assert.equal(dueDate('2026-01-25', 1, 'quincenal').toISOString().slice(0, 10), '2026-02-09'));
test('Horario peruano permite cierre exacto y rechaza almuerzo', () => {
  assert.doesNotThrow(() => checkHours(new Date('2026-09-08T12:00:00-05:00'), new Date('2026-09-08T13:00:00-05:00')));
  assert.throws(() => checkHours(new Date('2026-09-08T12:30:00-05:00'), new Date('2026-09-08T13:30:00-05:00')));
  assert.throws(() => checkHours(new Date('2026-09-08T14:00:00-05:00'), new Date('2026-09-08T15:00:00-05:00')));
});
