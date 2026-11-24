import { IdeaModel } from './idea.js';
import { RatingModel } from './rating.js';
import { SaveModel } from './save.js';
import { TagModel } from './tag.js';
import { UserModel } from './user.js';

export * from './idea.js';
export * from './rating.js';
export * from './save.js';
export * from './tag.js';
export * from './user.js';

/** The operations generic tooling (test DB, seeds) needs from every model. */
export interface AnyModel {
  readonly modelName: string;
  syncIndexes(): Promise<unknown>;
  deleteMany(filter: Record<string, never>): PromiseLike<unknown>;
}

export const allModels: AnyModel[] = [UserModel, TagModel, IdeaModel, RatingModel, SaveModel];
