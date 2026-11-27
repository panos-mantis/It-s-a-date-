export const paths = {
  home: '/',
  login: '/login',
  signup: '/signup',
  share: '/share',
  profile: '/profile',
  admin: '/admin',
  idea: (id: string) => `/ideas/${id}`,
} as const;
