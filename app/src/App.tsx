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
import NotFoundPage from '@/pages/not-found';

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <DashboardPage /> }],
      },
    ],
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
