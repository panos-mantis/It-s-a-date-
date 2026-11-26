import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@itsadate/shared';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { z } from 'zod';
import { paths } from '../../app/paths';
import { Button, Input, useToast } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { applyServerErrors, authResolverOptions } from '../../lib/form-errors';
import { useRegister } from './api';
import { AuthLayout, BusyStatus, FormError, PasswordInput, textLinkClasses } from './AuthLayout';
import { authPath, loginHint, safeNext } from './safe-next';

type Values = z.input<typeof registerSchema>;
type Parsed = z.output<typeof registerSchema>;

export function SignupPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const registerUser = useRegister();
  const statusId = useId();
  const [emailTaken, setEmailTaken] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, Parsed>({
    resolver: zodResolver(registerSchema, authResolverOptions),
    defaultValues: { name: '', email: '', password: '' },
  });

  const next = params.get('next');
  const reason = params.get('reason');
  const busy = isSubmitting || registerUser.isPending;
  const typedEmail = useWatch({ control, name: 'email' });

  const onSubmit = async (values: Parsed) => {
    setEmailTaken(false);
    try {
      const user = await registerUser.mutateAsync(values);
      toast.show(`You're in. Welcome, ${user.name}.`, { tone: 'success' });
      void navigate(safeNext(next), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEmailTaken(true);
        setError('email', { type: 'server', message: err.message }, { shouldFocus: true });
        return;
      }
      applyServerErrors(err, setError, ['name', 'email', 'password']);
    }
  };

  return (
    <AuthLayout
      title={
        <>
          Create your <em>account</em>
        </>
      }
      sub="Free, and all it takes is a name, an email and a password."
      hint={loginHint(next, reason)}
      footer={
        <>
          Already have an account?{' '}
          <Link to={authPath(paths.login, { next, reason })} className={textLinkClasses}>
            Log in
          </Link>
        </>
      }
    >
      <title>Sign up · It&apos;s a Date</title>
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
        aria-busy={busy}
        className="group flex flex-col gap-4"
      >
        <FormError message={errors.root?.server?.message} />
        <Input
          label="Name"
          autoComplete="name"
          placeholder="Maya Chen"
          readOnly={busy}
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          readOnly={busy}
          error={errors.email?.message}
          afterError={
            emailTaken ? (
              <Link
                to={authPath(paths.login, { email: typedEmail, next, reason })}
                className="inline-flex min-h-11 items-center self-start rounded-sm text-sm font-semibold text-accent-ink underline underline-offset-2 hover:decoration-2"
              >
                Log in instead
              </Link>
            ) : null
          }
          {...register('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          hint="At least 8 characters."
          readOnly={busy}
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" busy={busy} aria-describedby={statusId} className="w-full">
          Sign up
        </Button>
        <BusyStatus id={statusId} busy={busy} text="Creating your account…" />
      </form>
    </AuthLayout>
  );
}
