import { model, Schema, type HydratedDocument, type Types } from 'mongoose';

export interface ISave {
  user: Types.ObjectId;
  idea: Types.ObjectId;
  createdAt: Date;
}

const saveSchema = new Schema<ISave>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    idea: { type: Schema.Types.ObjectId, ref: 'Idea', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

saveSchema.index({ user: 1, idea: 1 }, { unique: true });
saveSchema.index({ idea: 1 });

export type SaveDoc = HydratedDocument<ISave>;
export const SaveModel = model<ISave>('Save', saveSchema, 'saves');
