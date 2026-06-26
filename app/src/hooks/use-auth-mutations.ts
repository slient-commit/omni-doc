import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '@/types/auth';

export function useLoginMutation() {
  return useMutation({
    mutationFn: (data: LoginRequest) =>
      api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      api.post<RegisterResponse>('/auth/register', data).then((r) => r.data),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) =>
      api.post<{ message: string }>('/auth/forgot-password', data).then((r) => r.data),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) =>
      api.post<{ message: string }>('/auth/reset-password', data).then((r) => r.data),
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) =>
      api.post<{ message: string }>('/auth/verify-email', data).then((r) => r.data),
  });
}
