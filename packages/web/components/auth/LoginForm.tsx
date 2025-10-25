'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/stores/authStore';
import { authApi } from '@/lib/api/authApi';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';

export default function LoginForm() {
  const router = useRouter();
  const { setAuth, setLoading } = useAuthStore();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError('');
      setLoading(true);

      const response = await authApi.login(data);

      setAuth(
        response.user,
        response.access_token,
        response.refresh_token
      );

      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'Error al iniciar sesión. Por favor, verifica tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Correo electrónico
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          {...register('email')}
          className="w-full"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Contraseña
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          className="w-full"
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link
            href="/auth/forgot-password"
            className="font-medium text-[hsl(142,100%,30%)] hover:text-[hsl(142,100%,25%)]"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-[hsl(142,100%,30%)] hover:bg-[hsl(142,100%,25%)] text-white"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Iniciar sesión
      </Button>

      <div className="text-center text-sm text-gray-600">
        ¿No tienes una cuenta?{' '}
        <Link
          href="/auth/register"
          className="font-medium text-[hsl(142,100%,30%)] hover:text-[hsl(142,100%,25%)]"
        >
          Registrarse
        </Link>
      </div>
    </form>
  );
}
