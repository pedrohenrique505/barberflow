import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { login } from "../features/auth/authApi";
import {
  loginSchema,
  type LoginFormData,
} from "../features/auth/authSchemas";
import { ApiError } from "../lib/api";
import { hasAuthToken, saveAuthToken } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";

export function LoginPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: login,
    onError: (error) => {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível entrar. Tente novamente.",
      );
    },
    onSuccess: (data) => {
      saveAuthToken(data.token);
      navigate("/dashboard", { replace: true });
    },
  });

  if (hasAuthToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthShell
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/register">
            Criar cadastro
          </Link>
        </>
      }
      subtitle="Entre para acompanhar agendamentos, equipe e serviços da sua barbearia."
      title="Entrar no BarberFlow"
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((data) => {
          setSubmitError(null);
          mutation.mutate(data);
        })}
      >
        {submitError ? <ErrorState message={submitError} title="Falha no login" /> : null}

        <Input
          autoComplete="email"
          error={errors.email?.message}
          label="E-mail"
          type="email"
          {...register("email")}
        />
        <Input
          autoComplete="current-password"
          error={errors.password?.message}
          label="Senha"
          type="password"
          {...register("password")}
        />
        <Button className="w-full" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? "Entrando..." : "Entrar"}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  );
}

type AuthShellProps = {
  children: ReactNode;
  footer: ReactNode;
  subtitle: string;
  title: string;
};

function AuthShell({ children, footer, subtitle, title }: AuthShellProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-text-primary">
      <section className="w-full max-w-md">
        <div className="mb-7">
          <p className="text-sm font-semibold text-text-secondary">BarberFlow</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-normal">
            {title}
          </h1>
          <p className="mt-3 text-pretty text-sm leading-6 text-text-secondary">
            {subtitle}
          </p>
        </div>
        <Card className="p-5 sm:p-6">{children}</Card>
        <p className="mt-5 text-center text-sm text-text-secondary">{footer}</p>
      </section>
    </main>
  );
}
