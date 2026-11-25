import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@itsadate/shared';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { z } from 'zod';
import { paths } from '../../app/paths';
import { Button, Input, useToast } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { applyServerErrors, authResolverOptions } from '../../lib/form-errors';
import { useRegister } from './api';
import { AuthLayout, FormError } from './AuthLayout';
import { safeNext } from './safe-next';

type Values = z.input<typeof registerSchema>;
type Parsed = z.output<typeof registerSchema>;

export function SignupPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, Parsed>({
    resolver: zodResolver(registerSchema, authResolverOptions),
    defaultValues: { name: '', email: '', password: '' },
  });

  const next = params.get('next');
  const loginTo = next ? `${paths.login}?next=${encodeURIComponent(next)}` : paths.login;

  const onSubmit = async (values: Parsed) => {
    try {
      const user = await registerUser.mutateAsync(values);
      toast.show(`You're in. Welcome, ${user.name}.`, { tone: 'success' });
      void navigate(safeNext(next), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('email', { type: 'server', message: err.message }, { shouldFocus: true });
        return;
      }
      applyServerErrors(err, setError, ['name', 'email', 'password']);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to={loginTo} className="font-semibold text-accent-ink underline">
            Log in
          </Link>
        </>
      }
    >
      <title>Sign up · It&apos;s a Date</title>
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
        className="flex flex-col gap-4"
      >
        <FormError message={errors.root?.server?.message} />
        <Input
          label="Name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting || registerUser.isPending}>
          Sign up
        </Button>
      </form>
    </AuthLayout>
  );
}
