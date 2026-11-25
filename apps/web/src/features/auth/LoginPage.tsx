import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@itsadate/shared';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { z } from 'zod';
import { paths } from '../../app/paths';
import { Button, Input, useToast } from '../../components/ui';
import { applyServerErrors, authResolverOptions } from '../../lib/form-errors';
import { useLogin } from './api';
import { AuthLayout, FormError } from './AuthLayout';
import { safeNext } from './safe-next';

type Values = z.input<typeof loginSchema>;
type Parsed = z.output<typeof loginSchema>;

export function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, Parsed>({
    resolver: zodResolver(loginSchema, authResolverOptions),
    defaultValues: { email: '', password: '' },
  });

  const next = params.get('next');
  const signupTo = next ? `${paths.signup}?next=${encodeURIComponent(next)}` : paths.signup;

  const onSubmit = async (values: Parsed) => {
    try {
      const user = await login.mutateAsync(values);
      toast.show(`Welcome back, ${user.name}.`, { tone: 'success' });
      void navigate(safeNext(next), { replace: true });
    } catch (err) {
      applyServerErrors(err, setError, ['email', 'password']);
      setFocus('password');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      footer={
        <>
          New here?{' '}
          <Link to={signupTo} className="font-semibold text-accent-ink underline">
            Sign up
          </Link>
        </>
      }
    >
      <title>Log in · It&apos;s a Date</title>
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
        className="flex flex-col gap-4"
      >
        <FormError message={errors.root?.server?.message} />
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting || login.isPending}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
