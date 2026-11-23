import type { Budget, Duration, IdeaStatus, PlaceType, Role } from './constants.js';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface TagDTO {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface IdeaDTO {
  id: string;
  title: string;
  description: string;
  image: { url: string; publicId: string } | null;
  tags: TagDTO[];
  placeType: PlaceType;
  budget: Budget | null;
  duration: Duration | null;
  status: IdeaStatus;
  ratingAvg: number;
  ratingCount: number;
  saveCount: number;
  creator: { id: string; name: string };
  createdAt: string;
  myRating: number | null;
  saved: boolean;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PlaceDTO {
  name: string;
  lat: number;
  lng: number;
  distanceM: number;
  address?: string;
  website?: string;
}

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; details?: unknown };
}

export interface ValidationIssue {
  location: 'body' | 'query' | 'params';
  /** Dot-joined path, e.g. `image.url`; empty string for the root. */
  path: string;
  message: string;
}

export interface ValidationErrorDetails {
  issues: ValidationIssue[];
}
