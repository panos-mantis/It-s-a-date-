import type { Budget, Duration, PlaceType } from '@itsadate/shared';
import { slugify } from '../lib/slug.js';

export interface SeedIdea {
  seedKey: string;
  title: string;
  description: string;
  /** Tag slugs; the first one is the idea's main tag. */
  tags: string[];
  placeType: PlaceType;
  budget: Budget;
  duration: Duration;
}

type Draft = Omit<SeedIdea, 'seedKey'>;

const DRAFTS: Draft[] = [
  // Food
  {
    title: 'Dumpling crawl',
    description:
      'Pick three dumpling spots within walking distance and order one plate at each. Compare the fillings, argue about the dipping sauce, and keep the best place for round two.',
    tags: ['food'],
    placeType: 'restaurant',
    budget: 2,
    duration: 'short',
  },
  {
    title: 'Sushi counter night',
    description:
      'Grab two seats at the counter and let the chef choose. Ask what is best today, try one thing neither of you would normally order, and take your time.',
    tags: ['food'],
    placeType: 'sushi',
    budget: 3,
    duration: 'short',
  },
  {
    title: 'Pastry walk',
    description:
      'Start at a bakery you love and end at one you have never tried. Share a pastry at each stop and sit on a bench in between. It is a slow, sweet way to spend a morning.',
    tags: ['food', 'self-date'],
    placeType: 'cafe',
    budget: 1,
    duration: 'half-day',
  },
  {
    title: 'Farmers market lunch',
    description:
      'Wander the stalls with no list and a tote bag. Build a picnic from whatever looks best, then find a patch of grass and eat it all.',
    tags: ['food', 'adventure'],
    placeType: 'park',
    budget: 1,
    duration: 'full-day',
  },

  // Adventure
  {
    title: 'Golden-hour viewpoint drive',
    description:
      'Chase the last hour of daylight to the best lookout within reach. Bring a thermos, a blanket and a playlist, and stay until the lights come on below you.',
    tags: ['adventure'],
    placeType: 'viewpoint',
    budget: 1,
    duration: 'half-day',
  },
  {
    title: 'Climbing gym session',
    description:
      'Rent shoes, take the intro lesson and cheer each other up the easy wall. You will spot each other, laugh at the falls and be hungry afterwards.',
    tags: ['adventure'],
    placeType: 'climbing_gym',
    budget: 2,
    duration: 'short',
  },
  {
    title: 'Sunrise hike with a thermos',
    description:
      'Set the alarm early and walk a short trail to catch the first light. Pour something hot at the top and have breakfast with the whole sky as your table.',
    tags: ['adventure'],
    placeType: 'park',
    budget: 1,
    duration: 'half-day',
  },
  {
    title: 'Paddleboard day',
    description:
      'Rent two boards on a calm lake or bay and head out slowly. Expect a few wobbles and a splash or two. Finish with something cold on the shore.',
    tags: ['adventure'],
    placeType: 'beach',
    budget: 2,
    duration: 'full-day',
  },
  {
    title: 'Day trip by train',
    description:
      'Choose a town you have never visited and take the morning train out. Leave the itinerary open, walk everywhere, have lunch wherever smells best and catch the last train home.',
    tags: ['adventure'],
    placeType: 'none',
    budget: 3,
    duration: 'full-day',
  },

  // Home
  {
    title: 'Pizza from scratch',
    description:
      'Make the dough together, then pile on whatever is in the fridge. Stretch it badly, bake it hot and eat it straight off the tray.',
    tags: ['home', 'food'],
    placeType: 'none',
    budget: 1,
    duration: 'short',
  },
  {
    title: 'Backyard movie night',
    description:
      'Hang a sheet, point a projector or a laptop at it and bring out every blanket you own. Make popcorn, dim the lights and let the stars do the rest.',
    tags: ['home'],
    placeType: 'none',
    budget: 1,
    duration: 'short',
  },
  {
    title: 'Three-course dinner at home',
    description:
      'Plan a starter, a main and a dessert, and divide the cooking. Set the table properly, light a candle and take the evening one course at a time.',
    tags: ['home', 'food'],
    placeType: 'none',
    budget: 2,
    duration: 'half-day',
  },
  {
    title: 'Slow Sunday in',
    description:
      'Cancel the plans and stay in your pajamas. Make pancakes, read side by side, take a nap and do one small project together just because.',
    tags: ['home'],
    placeType: 'none',
    budget: 1,
    duration: 'full-day',
  },

  // Self-date
  {
    title: 'Solo matinee',
    description:
      'Pick an afternoon showing of something you have been curious about and go on your own. Sit wherever you like, get the big popcorn and let yourself enjoy it.',
    tags: ['self-date'],
    placeType: 'cinema',
    budget: 1,
    duration: 'short',
  },
  {
    title: 'Bookshop and coffee afternoon',
    description:
      'Browse an independent bookshop until something finds you. Take it to a cafe nearby, order a good coffee and read the first chapter before you head home.',
    tags: ['self-date', 'learning'],
    placeType: 'cafe',
    budget: 1,
    duration: 'half-day',
  },
  {
    title: 'Sketch in the park',
    description:
      'Bring a small notebook and a pen and draw whatever you see: a tree, a dog, a stranger with great shoes. It does not need to be good. It only needs to be quiet and yours.',
    tags: ['self-date'],
    placeType: 'park',
    budget: 1,
    duration: 'short',
  },
  {
    title: 'A neighborhood you never visit',
    description:
      'Choose a part of town you usually skip and walk it with no destination. Duck into the shops that catch your eye and have a snack wherever you end up.',
    tags: ['self-date', 'adventure'],
    placeType: 'none',
    budget: 1,
    duration: 'half-day',
  },

  // Board games
  {
    title: 'Bowling with silly rules',
    description:
      'Invent house rules before the first frame: left hand only, bowl backwards, a forfeit for every gutter ball. Keep score honestly, or do not.',
    tags: ['board-game'],
    placeType: 'bowling',
    budget: 2,
    duration: 'short',
  },
  {
    title: 'Escape room for two',
    description:
      'Pick a room built for small teams and race the clock together. You will find out quickly who panics, who hoards clues and who is secretly brilliant at riddles.',
    tags: ['board-game'],
    placeType: 'escape_room',
    budget: 2,
    duration: 'short',
  },
  {
    title: 'Puzzle night',
    description:
      'Tip out a thousand-piece puzzle, find the edges first and put on a long album. Snacks are required. Leave it on the table so you can add a few pieces whenever you pass.',
    tags: ['board-game', 'home'],
    placeType: 'none',
    budget: 1,
    duration: 'short',
  },
  {
    title: 'Game cafe afternoon',
    description:
      'Find a cafe with a shelf of games and ask the staff for something neither of you has played. Order a snack, read the rules together and play the first round slowly.',
    tags: ['board-game'],
    placeType: 'cafe',
    budget: 2,
    duration: 'half-day',
  },

  // Dancing
  {
    title: 'Kitchen dance party',
    description:
      'Clear a bit of floor, plug in a speaker and take turns picking songs. Dance badly on purpose and keep going until someone needs water.',
    tags: ['dancing', 'home'],
    placeType: 'none',
    budget: 1,
    duration: 'short',
  },
  {
    title: 'Salsa social night',
    description:
      'Many studios run a beginner lesson before an open social. Learn a basic step, swap partners if you feel brave and stay for the last song.',
    tags: ['dancing'],
    placeType: 'bar',
    budget: 2,
    duration: 'short',
  },
  {
    title: 'Dress-up night at a jazz club',
    description:
      'Wear the outfit you save for special occasions and book a table near the band. Order something good, stay for both sets and slow dance on the way home.',
    tags: ['dancing'],
    placeType: 'bar',
    budget: 3,
    duration: 'short',
  },
  {
    title: 'Summer festival day',
    description:
      'Pick an outdoor music festival or free concert series and spend the whole day there. Bring a blanket and sunscreen, wander between stages and dance when the right song comes on.',
    tags: ['dancing', 'adventure'],
    placeType: 'park',
    budget: 2,
    duration: 'full-day',
  },

  // Self-care
  {
    title: 'Thermal bath day',
    description:
      'Book a day pass at a bathhouse or thermal spa and move slowly between hot pools, cold plunges and quiet rooms. Leave your phone in the locker and your plans at the door.',
    tags: ['self-care'],
    placeType: 'spa',
    budget: 3,
    duration: 'full-day',
  },
  {
    title: 'Couples massage',
    description:
      'Book side-by-side treatments and arrive early enough for tea. The best part is the hour after: nowhere to be and nothing to decide.',
    tags: ['self-care'],
    placeType: 'spa',
    budget: 3,
    duration: 'half-day',
  },
  {
    title: 'Morning yoga on the grass',
    description:
      'Roll out two mats in a quiet corner of the park and follow a free video on one phone. Finish with a few slow breaths and a coffee from the nearest cart.',
    tags: ['self-care'],
    placeType: 'park',
    budget: 1,
    duration: 'short',
  },
  {
    title: 'Sunset beach walk',
    description:
      'Take your shoes off and walk the waterline as the light goes soft. Collect one shell each, say nothing for a while and stay until the sky changes color.',
    tags: ['self-care'],
    placeType: 'beach',
    budget: 1,
    duration: 'short',
  },

  // Learning
  {
    title: 'Pottery for two',
    description:
      'Sign up for a drop-in wheel class and try to shape something that resembles a bowl. Yours will wobble, and that is the charm of it. Come back in a week to collect what survived the kiln.',
    tags: ['learning'],
    placeType: 'none',
    budget: 2,
    duration: 'half-day',
  },
  {
    title: 'Planetarium show',
    description:
      'Lean back in the dark and let someone else point out the constellations. Afterwards, walk home looking up and see how many you can still find.',
    tags: ['learning'],
    placeType: 'museum',
    budget: 2,
    duration: 'short',
  },
  {
    title: 'Cook something hard together',
    description:
      'Sign up for a hands-on cooking class: fresh pasta, dumplings or bread. You will make a mess, learn a real technique and sit down to eat what you made.',
    tags: ['learning', 'food'],
    placeType: 'none',
    budget: 3,
    duration: 'half-day',
  },
  {
    title: 'Beginner improv workshop',
    description:
      'Join a one-off improv class where nobody is watching but the other beginners. Say yes to everything, play along and enjoy how quickly strangers become friends.',
    tags: ['learning'],
    placeType: 'theatre',
    budget: 2,
    duration: 'short',
  },
];

export const SEED_IDEAS: SeedIdea[] = DRAFTS.map((d) => ({ seedKey: slugify(d.title), ...d }));
