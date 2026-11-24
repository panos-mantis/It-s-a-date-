import mongoose from 'mongoose';

/**
 * One line for a script's stderr. Server errors are reduced to code, namespace and index name,
 * because their messages quote key values (a duplicate email, for example).
 */
export function describeScriptError(e: unknown): string {
  if (e instanceof mongoose.mongo.MongoServerError) {
    const ns = /collection: (\S+)/.exec(e.message)?.[1];
    const index = /index: (\S+)/.exec(e.message)?.[1];
    const code = `${String(e.code ?? '?')}${e.codeName ? ` (${e.codeName})` : ''}`;
    return `MongoDB error ${code}${ns ? ` on ${ns}` : ''}${index ? `, index ${index}` : ''}`;
  }
  return e instanceof Error ? e.message : 'Unexpected error';
}
