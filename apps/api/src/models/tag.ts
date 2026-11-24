import { model, Schema, type HydratedDocument } from 'mongoose';

export interface ITag {
  name: string;
  slug: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: '' },
  },
  { timestamps: true },
);

export type TagDoc = HydratedDocument<ITag>;
export const TagModel = model<ITag>('Tag', tagSchema, 'tags');
