"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.ok) {
          router.replace("/admin/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/admin/dashboard");
        return;
      }
      setError(data.error || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow border border-slate-200 p-8">
          <div className="text-center mb-6">
            <Link href="/" className="text-sky-600 hover:underline text-sm">
              ← Volver al inicio
            </Link>
            <h1 className="text-xl font-bold text-slate-800 mt-2">Administrador</h1>
            <p className="text-slate-500 text-sm">Ingresa la contraseña</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Verificando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
