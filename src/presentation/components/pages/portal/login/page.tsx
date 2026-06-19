"use client";

import { useState, type FormEvent } from "react";
import { usePortalAuth } from "@/src/modules/portal/presentation/hooks/use-portal-auth";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";

export default function PortalLoginPage() {
  const { login, isLoggingIn } = usePortalAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await login({ email, password });
    } catch {
      setError("E-mail ou senha incorretos.");
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Painel Reserve</h1>
        <Input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
