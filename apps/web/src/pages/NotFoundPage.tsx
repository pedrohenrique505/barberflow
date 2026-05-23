import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-text-primary">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold text-text-secondary">404</p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-normal">
          Página não encontrada
        </h1>
        <p className="mt-3 text-pretty text-sm leading-6 text-text-secondary">
          O endereço acessado não existe no painel do BarberFlow.
        </p>
        <Link
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white [transition-property:color,background-color,transform] duration-150 ease-out hover:bg-[#201c18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.96]"
          to="/dashboard"
        >
          Voltar ao dashboard
        </Link>
      </section>
    </main>
  );
}
