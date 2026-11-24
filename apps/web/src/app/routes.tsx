import type { RouteObject } from 'react-router';
import { HomePage } from '../features/home/HomePage';
import { LoginPage } from '../features/auth/LoginPage';
import { SignupPage } from '../features/auth/SignupPage';
import { RedirectIfAuthed, RequireAuth, RequireRole } from './guards';
import { RootLayout } from './layout/RootLayout';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: (
      <RootLayout>
        <NotFoundPage />
      </RootLayout>
    ),
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'login',
        element: (
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        ),
      },
      {
        path: 'signup',
        element: (
          <RedirectIfAuthed>
            <SignupPage />
          </RedirectIfAuthed>
        ),
      },
      {
        path: 'share',
        element: (
          <RequireAuth>
            <ComingSoonPage title="Share an idea" />
          </RequireAuth>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <ComingSoonPage title="Profile" />
          </RequireAuth>
        ),
      },
      {
        path: 'admin',
        element: (
          // eslint-disable-next-line jsx-a11y/aria-role -- a user role, not an ARIA role
          <RequireRole role="admin">
            <ComingSoonPage title="Admin" />
          </RequireRole>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
