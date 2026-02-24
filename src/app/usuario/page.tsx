"use client";

import { useState } from "react";
import Link from "next/link";

type Restriccion = "ninguna" | "vegano" | "vegetariano" | "celiaco";

interface PersonaEncontrada {
  id: string;
  rut: string;
  dv: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  seccion_core: string;
  carrera: string | null;
  asistencia: { id: string; restriccion_alimentaria: string | null } | null;
}

export default function UsuarioPage() {
  const [rutCompleto, setRutCompleto] = useState("");
  const [persona, setPersona] = useState<PersonaEncontrada | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restriccion, setRestriccion] = useState<Restriccion>("ninguna");
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  function parseRut(input: string): { rut: string; dv: string } | null {
    const limpio = input.replace(/[.\s-]/g, "").toUpperCase();
    if (limpio.length < 2) return null;
    const dv = limpio.slice(-1);
    const rut = limpio.slice(0, -1).replace(/\D/g, "");
    if (!rut || !/^\d+$/.test(rut)) return null;
    if (!/^[\dK]$/.test(dv)) return null;
    return { rut, dv };
  }

  async function buscar() {
    setError("");
    setPersona(null);
    const parsed = parseRut(rutCompleto);
    if (!parsed) {
      setError("Ingresa un RUT válido (ej: 12345678-9)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/personas/buscar?rut=${encodeURIComponent(parsed.rut)}&dv=${encodeURIComponent(parsed.dv)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al buscar");
        return;
      }
      setPersona(data);
      setRestriccion((data.asistencia?.restriccion_alimentaria as Restriccion) || "ninguna");
      setRegistrado(!!data.asistencia);
    } finally {
      setLoading(false);
    }
  }

  async function registrarAsistencia() {
    if (!persona) return;
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/asistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona_id: persona.id,
          restriccion_alimentaria: restriccion,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al registrar");
        return;
      }
      setRegistrado(true);
      setPersona((p) =>
        p
          ? {
              ...p,
              asistencia: {
                id: data.id,
                restriccion_alimentaria: restriccion,
              },
            }
          : null
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-sky-600 hover:underline font-medium">
            ← Inicio
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Registro de Asistencia</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Buscar por RUT (con dígito verificador)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: 12345678-9"
              value={rutCompleto}
              onChange={(e) => setRutCompleto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
            <button
              onClick={buscar}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 disabled:opacity-50"
            >
              {loading ? "Buscando…" : "Buscar"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {persona && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div>
              <p className="text-sm text-slate-500">Nombres</p>
              <p className="text-lg font-semibold text-slate-800">{persona.nombres}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Apellido paterno</p>
                <p className="text-lg font-semibold text-slate-800">{persona.apellido_paterno}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Apellido materno</p>
                <p className="text-lg font-semibold text-slate-800">{persona.apellido_materno}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Carrera</p>
              <p className="text-lg font-semibold text-slate-800">
                {persona.carrera || "—"}
              </p>
            </div>
            <div className="rounded-xl bg-sky-50 border-2 border-sky-200 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 mb-1">Sección CORE</p>
              <p className="text-2xl font-bold text-sky-700">{persona.seccion_core}</p>
            </div>

            {registrado ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 pt-4">
                <p className="font-medium text-emerald-800">Asistencia ya registrada</p>
                {persona.asistencia?.restriccion_alimentaria &&
                  persona.asistencia.restriccion_alimentaria !== "ninguna" && (
                    <p className="text-sm text-emerald-700 mt-1">
                      Restricción indicada: {persona.asistencia.restriccion_alimentaria === "celiaco" ? "Celíaco" : persona.asistencia.restriccion_alimentaria.replace("_", " ")}
                    </p>
                  )}
              </div>
            ) : (
              <>
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ¿Tienes alguna restricción alimentaria?
                  </label>
                  <select
                    value={restriccion}
                    onChange={(e) => setRestriccion(e.target.value as Restriccion)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  >
                    <option value="ninguna">Ninguna</option>
                    <option value="vegano">Vegano</option>
                    <option value="vegetariano">Vegetariano</option>
                    <option value="celiaco">Celíaco</option>
                  </select>
                </div>
                <button
                  onClick={registrarAsistencia}
                  disabled={enviando}
                  className="w-full py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 disabled:opacity-50"
                >
                  {enviando ? "Registrando…" : "Registrar asistencia"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
