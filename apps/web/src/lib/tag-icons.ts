import {
  Bike,
  BookOpen,
  Camera,
  CircleHelp,
  Coffee,
  Dice5,
  Film,
  Flower2,
  Heart,
  House,
  type LucideIcon,
  Mountain,
  Music,
  Palette,
  Sparkles,
  Tent,
  Utensils,
  Wine,
} from 'lucide-react';

const TAG_ICONS = {
  utensils: Utensils,
  mountain: Mountain,
  house: House,
  heart: Heart,
  'dice-5': Dice5,
  music: Music,
  'flower-2': Flower2,
  'book-open': BookOpen,
  coffee: Coffee,
  film: Film,
  palette: Palette,
  tent: Tent,
  bike: Bike,
  wine: Wine,
  camera: Camera,
  sparkles: Sparkles,
} as const satisfies Record<string, LucideIcon>;

export type TagIconName = keyof typeof TAG_ICONS;

/** The curated set an admin picks from (R38), in HANDOFF order. */
export const TAG_ICON_NAMES = Object.keys(TAG_ICONS) as TagIconName[];

/** Unknown names (old data, API-made tags) get a fallback icon instead of breaking the chip. */
export function tagIcon(name: string): LucideIcon {
  return Object.hasOwn(TAG_ICONS, name) ? TAG_ICONS[name as TagIconName] : CircleHelp;
}
