import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { register as registerAccount } from "../features/auth/authApi";
import {
  registerSchema,
  type RegisterFormData,
} from "../features/auth/authSchemas";
import { ApiError } from "../lib/api";
import { hasAuthToken, saveAuthToken } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";

export function RegisterPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: registerAccount,
    onError: (error) => {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível criar a conta. Tente novamente.",
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
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-text-primary">
      <section className="w-full max-w-md">
        <div className="mb-7">
          <p className="text-sm font-semibold text-text-secondary">BarberFlow</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-normal">
            Criar conta
          </h1>
          <p className="mt-3 text-pretty text-sm leading-6 text-text-secondary">
            Cadastre o acesso do dono da barbearia para começar a configurar a operação.
          </p>
        </div>
        <Card className="p-5 sm:p-6">
          <form
            className="space-y-4"
            onSubmit={handleSubmit((data) => {
              setSubmitError(null);
              mutation.mutate(data);
            })}
          >
            {submitError ? (
              <ErrorState message={submitError} title="Falha no cadastro" />
            ) : null}

            <Input
              autoComplete="name"
              error={errors.name?.message}
              label="Nome"
              type="text"
              {...register("name")}
            />
            <Input
              autoComplete="email"
              error={errors.email?.message}
              label="E-mail"
              type="email"
              {...register("email")}
            />
            <Input
              autoComplete="new-password"
              error={errors.password?.message}
              label="Senha"
              type="password"
              {...register("password")}
            />
            <Button className="w-full" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Criando conta..." : "Criar conta"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </form>
        </Card>
        <p className="mt-5 text-center text-sm text-text-secondary">
          Já tem conta?{" "}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
