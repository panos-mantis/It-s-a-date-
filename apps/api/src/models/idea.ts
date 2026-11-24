import { model, Schema, type HydratedDocument, type Types } from 'mongoose';
import {
  BUDGETS,
  DURATIONS,
  IDEA_STATUSES,
  PLACE_TYPES,
  type Budget,
  type Duration,
  type IdeaStatus,
  type PlaceType,
} from '@itsadate/shared';

export interface IIdea {
  title: string;
  description: string;
  image: { url: string; publicId: string } | null;
  tags: Types.ObjectId[];
  placeType: PlaceType;
  budget: Budget | null;
  duration: Duration | null;
  creator: Types.ObjectId;
  status: IdeaStatus;
  ratingAvg: number;
  ratingCount: number;
  saveCount: number;
  seedKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<{ url: string; publicId: string }>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const ideaSchema = new Schema<IIdea>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: imageSchema, default: null },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    placeType: { type: String, enum: PLACE_TYPES, default: 'none' },
    budget: { type: Number, enum: [...BUDGETS, null], default: null },
    duration: { type: String, enum: [...DURATIONS, null], default: null },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: IDEA_STATUSES, default: 'pending' },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },
    seedKey: { type: String },
  },
  { timestamps: true },
);

ideaSchema.index({ status: 1, createdAt: -1 });
ideaSchema.index({ status: 1, ratingAvg: -1 });
ideaSchema.index({ tags: 1 });
ideaSchema.index({ budget: 1 });
ideaSchema.index({ duration: 1 });
ideaSchema.index({ creator: 1, createdAt: -1 });
ideaSchema.index({ seedKey: 1 }, { unique: true, sparse: true });

export type IdeaDoc = HydratedDocument<IIdea>;
export const IdeaModel = model<IIdea>('Idea', ideaSchema, 'ideas');
