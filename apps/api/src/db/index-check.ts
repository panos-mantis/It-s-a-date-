import { allModels } from '../models/index.js';

/**
 * Indexes the schemas declare but the database lacks. Read-only: never creates anything, so it is
 * safe against the legacy prod DB (building indexes there is the migration's job).
 */
export async function missingIndexes(): Promise<{ model: string; index: string }[]> {
  const missing: { model: string; index: string }[] = [];
  for (const model of allModels) {
    const { toCreate } = await model.diffIndexes();
    for (const spec of toCreate) {
      missing.push({ model: model.modelName, index: Object.keys(spec).join(',') });
    }
  }
  return missing;
}
