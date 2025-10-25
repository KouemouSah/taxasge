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
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';

export default function RegisterForm() {
  const router = useRouter();
  const { setAuth, setLoading } = useAuthStore();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'citizen',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError('');
      setLoading(true);

      const response = await authApi.register(data);

      setAuth(
        response.user,
        response.access_token,
        response.refresh_token
      );

      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'Error al crear la cuenta. Por favor, verifica tus datos.'
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

      {/* Role Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Tipo de cuenta
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <label
            className={`
              relative flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 text-center
              transition-colors
              ${selectedRole === 'citizen'
                ? 'border-[hsl(142,100%,30%)] bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input
              type="radio"
              value="citizen"
              {...register('role')}
              className="sr-only"
              disabled={isSubmitting}
            />
            <span className="text-sm font-medium">Ciudadano</span>
            <span className="text-xs text-gray-600">Persona física</span>
          </label>

          <label
            className={`
              relative flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 text-center
              transition-colors
              ${selectedRole === 'agent'
                ? 'border-[hsl(142,100%,30%)] bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input
              type="radio"
              value="agent"
              {...register('role')}
              className="sr-only"
              disabled={isSubmitting}
            />
            <span className="text-sm font-medium">Agente</span>
            <span className="text-xs text-gray-600">Representante</span>
          </label>

          <label
            className={`
              relative flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 text-center
              transition-colors
              ${selectedRole === 'admin'
                ? 'border-[hsl(142,100%,30%)] bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input
              type="radio"
              value="admin"
              {...register('role')}
              className="sr-only"
              disabled={isSubmitting}
            />
            <span className="text-sm font-medium">Administrador</span>
            <span className="text-xs text-gray-600">Gestión completa</span>
          </label>
        </div>
        {errors.role && (
          <p className="text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
            Nombre
          </Label>
          <Input
            id="first_name"
            type="text"
            placeholder="Juan"
            {...register('first_name')}
            className="w-full"
            disabled={isSubmitting}
          />
          {errors.first_name && (
            <p className="text-sm text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
            Apellido
          </Label>
          <Input
            id="last_name"
            type="text"
            placeholder="García"
            {...register('last_name')}
            className="w-full"
            disabled={isSubmitting}
          />
          {errors.last_name && (
            <p className="text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
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

      {/* Phone (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
          Teléfono <span className="text-gray-500">(opcional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+240 XXX XXX XXX"
          {...register('phone')}
          className="w-full"
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Password */}
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

      <Button
        type="submit"
        className="w-full bg-[hsl(142,100%,30%)] hover:bg-[hsl(142,100%,25%)] text-white"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Crear cuenta
      </Button>

      <div className="text-center text-sm text-gray-600">
        ¿Ya tienes una cuenta?{' '}
        <Link
          href="/auth/login"
          className="font-medium text-[hsl(142,100%,30%)] hover:text-[hsl(142,100%,25%)]"
        >
          Iniciar sesión
        </Link>
      </div>
    </form>
  );
}
