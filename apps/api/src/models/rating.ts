import { model, Schema, type HydratedDocument, type Types } from 'mongoose';

export interface IRating {
  idea: Types.ObjectId;
  user: Types.ObjectId;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    idea: { type: Schema.Types.ObjectId, ref: 'Idea', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: 'value must be an integer' },
    },
  },
  { timestamps: true },
);

ratingSchema.index({ idea: 1, user: 1 }, { unique: true });
ratingSchema.index({ user: 1 });

export type RatingDoc = HydratedDocument<IRating>;
export const RatingModel = model<IRating>('Rating', ratingSchema, 'ratings');
