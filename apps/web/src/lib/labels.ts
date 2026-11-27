import { BUDGET_LABELS, DURATION_LABELS, type IdeaDTO, type PlaceType } from '@itsadate/shared';

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  none: 'No place needed',
  restaurant: 'Restaurant',
  sushi: 'Sushi',
  cafe: 'Cafe',
  bar: 'Bar',
  park: 'Park',
  viewpoint: 'Viewpoint',
  museum: 'Museum',
  cinema: 'Cinema',
  theatre: 'Theatre',
  climbing_gym: 'Climbing gym',
  bowling: 'Bowling',
  escape_room: 'Escape room',
  spa: 'Spa',
  beach: 'Beach',
};

/** "$$ · Half day", "$$", "Half day", or null when neither is set. */
export function ideaMeta(idea: Pick<IdeaDTO, 'budget' | 'duration'>): string | null {
  const parts = [
    idea.budget === null ? null : BUDGET_LABELS[idea.budget],
    idea.duration === null ? null : DURATION_LABELS[idea.duration],
  ].filter((p): p is string => p !== null);
  return parts.length ? parts.join(' · ') : null;
}
