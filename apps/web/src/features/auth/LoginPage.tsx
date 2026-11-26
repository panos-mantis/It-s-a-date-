import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@itsadate/shared';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { z } from 'zod';
import { paths } from '../../app/paths';
import { Button, Input, useToast } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { applyServerErrors, authResolverOptions } from '../../lib/form-errors';
import { useLogin } from './api';
import { AuthLayout, BusyStatus, FormError, PasswordInput, textLinkClasses } from './AuthLayout';
import { authPath, loginHint, safeNext } from './safe-next';

type Values = z.input<typeof loginSchema>;
type Parsed = z.output<typeof loginSchema>;

export function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const login = useLogin();
  const statusId = useId();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, Parsed>({
    resolver: zodResolver(loginSchema, authResolverOptions),
    defaultValues: { email: params.get('email') ?? '', password: '' },
  });

  const next = params.get('next');
  const reason = params.get('reason');
  const busy = isSubmitting || login.isPending;

  const onSubmit = async (values: Parsed) => {
    try {
      const user = await login.mutateAsync(values);
      toast.show(`Welcome back, ${user.name}.`, { tone: 'success' });
      void navigate(safeNext(next), { replace: true });
    } catch (err) {
      applyServerErrors(err, setError, ['email', 'password']);
      // A wrong password is cleared so it can be typed again; the email stays.
      if (err instanceof ApiError && err.status === 401) {
        setValue('password', '');
        setFocus('password');
      }
    }
  };

  return (
    <AuthLayout
      title={
        <>
          Welcome <em>back</em>
        </>
      }
      sub="Log in to save ideas, rate them and share your own."
      hint={loginHint(next, reason)}
      footer={
        <>
          New here?{' '}
          <Link to={authPath(paths.signup, { next, reason })} className={textLinkClasses}>
            Create an account
          </Link>
        </>
      }
    >
      <title>Log in · It&apos;s a Date</title>
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
        aria-busy={busy}
        className="group flex flex-col gap-4"
      >
        <FormError message={errors.root?.server?.message} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          readOnly={busy}
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          readOnly={busy}
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" busy={busy} aria-describedby={statusId} className="w-full">
          Log in
        </Button>
        <BusyStatus id={statusId} busy={busy} text="Logging you in…" />
      </form>
    </AuthLayout>
  );
}
