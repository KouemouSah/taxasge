import RegisterForm from '@/components/auth/RegisterForm';
import Image from 'next/image';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <Image
            src="/logo-gq.svg"
            alt="República de Guinea Ecuatorial"
            width={80}
            height={80}
            className="mx-auto"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            TaxasGE
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Crear una nueva cuenta
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm />
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>República de Guinea Ecuatorial</p>
          <p className="mt-1">Sistema de Gestión de Tasas y Servicios Fiscales</p>
        </div>
      </div>
    </div>
  );
}
