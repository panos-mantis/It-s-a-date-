import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { describeScriptError } from './describe-error.js';

describe('describeScriptError', () => {
  it('reduces a MongoServerError to its code and namespace, never key values', () => {
    const err = new mongoose.mongo.MongoServerError({
      message:
        'E11000 duplicate key error collection: itsadate_dev.users index: email_1 dup key: { email: "ana@x.com" }',
      code: 11000,
      codeName: 'DuplicateKey',
    });
    const text = describeScriptError(err);
    expect(text).toBe('MongoDB error 11000 (DuplicateKey) on itsadate_dev.users, index email_1');
    expect(text).not.toMatch(/ana/);
  });

  it('keeps the message of other errors', () => {
    expect(describeScriptError(new Error('Database name did not match'))).toBe(
      'Database name did not match',
    );
    expect(describeScriptError('weird')).toBe('Unexpected error');
  });
});
