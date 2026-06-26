import { createBrowserRouter, RouterProvider } from 'react-router';
import { ProtectedRoute } from '@/components/protected-route';
import { AuthLayout } from '@/layouts/auth-layout';
import { AppLayout } from '@/layouts/app-layout';

import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import ForgotPasswordPage from '@/pages/forgot-password';
import ResetPasswordPage from '@/pages/reset-password';
import VerifyEmailPage from '@/pages/verify-email';
import DashboardPage from '@/pages/dashboard';
import MyDocumentsPage from '@/pages/my-documents';
import SharedPage from '@/pages/shared';
import TrashPage from '@/pages/trash';
import SettingsLayout from '@/pages/settings/settings-layout';
import GeneralTab from '@/pages/settings/general-tab';
import UsersTab from '@/pages/settings/users-tab';
import RolesTab from '@/pages/settings/roles-tab';
import SharedLinkPage from '@/pages/shared-link';
import NotFoundPage from '@/pages/not-found';

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'my-documents', element: <MyDocumentsPage /> },
          { path: 'shared', element: <SharedPage /> },
          { path: 'trash', element: <TrashPage /> },
          {
            path: 'settings',
            element: <SettingsLayout />,
            children: [
              { index: true, element: <GeneralTab /> },
              { path: 'users', element: <UsersTab /> },
              { path: 'roles', element: <RolesTab /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/shared/:token',
    element: <SharedLinkPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
