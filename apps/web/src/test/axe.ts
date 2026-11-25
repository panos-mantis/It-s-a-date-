import axe from 'axe-core';

export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  const ids = results.violations.map((v) => v.id);
  if (ids.length > 0) {
    throw new Error(`Axe violations: ${ids.join(', ')}`);
  }
}
