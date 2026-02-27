"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface PersonaRow {
  id: string;
  rut: string;
  dv: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo_uai: string | null;
  seccion_core: string;
  carrera: string | null;
  asistencia: {
    id: string;
    registrado_at: string;
    restriccion_alimentaria: string | null;
  } | null;
}

interface Stats {
  total_personas: number;
  total_registrados: number;
  total_sin_registrar: number;
  por_seccion: Record<string, { total: number; registrados: number }>;
  por_carrera: Record<string, { total: number; registrados: number }>;
  por_restriccion: Record<string, number>;
}

export default function AdminDashboardPage() {
  const [personas, setPersonas] = useState<PersonaRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"todos" | "registrados" | "sin-registrar">("todos");
  const [busquedaApellido, setBusquedaApellido] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [quitandoId, setQuitandoId] = useState<string | null>(null);
  const [vaciendo, setVaciando] = useState(false);
  const [seccionesEnBuses, setSeccionesEnBuses] = useState<string[]>([]);
  const [togglingBuses, setTogglingBuses] = useState<string | null>(null);
  const [seccionesAlmuerzoEntregado, setSeccionesAlmuerzoEntregado] = useState<string[]>([]);
  const [togglingAlmuerzo, setTogglingAlmuerzo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [listRes, statsRes, busesRes, almuerzoRes] = await Promise.all([
        fetch("/api/admin/personas"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/buses"),
        fetch("/api/admin/almuerzo-entregado"),
      ]);
      if (!listRes.ok) {
        if (listRes.status === 401) {
          window.location.href = "/admin";
          return;
        }
        setError("Error al cargar personas");
        return;
      }
      const list = await listRes.json();
      setPersonas(list);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (busesRes.ok) {
        const buses = await busesRes.json();
        setSeccionesEnBuses(buses);
      }
      if (almuerzoRes.ok) {
        const almuerzo = await almuerzoRes.json();
        setSeccionesAlmuerzoEntregado(almuerzo);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al subir");
        return;
      }
      setUploadFile(null);
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin";
  }

  async function eliminarTodaLaLista() {
    if (
      !confirm(
        "¿Eliminar toda la lista? Se borrarán todas las personas y sus registros de asistencia. Podrás subir un nuevo archivo XLS después. Esta acción no se puede deshacer."
      )
    )
      return;
    setVaciando(true);
    setError("");
    try {
      const res = await fetch("/api/admin/personas", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al eliminar la lista");
        return;
      }
      await load();
    } finally {
      setVaciando(false);
    }
  }

  async function quitarRegistro(personaId: string) {
    if (!confirm("¿Quitar el registro de asistencia de esta persona? La persona seguirá en la lista y podrá volver a registrarse.")) return;
    setQuitandoId(personaId);
    try {
      const res = await fetch(`/api/admin/asistencias/${personaId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al quitar registro");
        return;
      }
      await load();
    } finally {
      setQuitandoId(null);
    }
  }

  async function toggleBuses(seccion_core: string) {
    setTogglingBuses(seccion_core);
    const estaEnBuses = seccionesEnBuses.includes(seccion_core);
    try {
      if (estaEnBuses) {
        const res = await fetch(`/api/admin/buses?seccion_core=${encodeURIComponent(seccion_core)}`, { method: "DELETE" });
        if (!res.ok) {
          setError("Error al quitar de buses");
          return;
        }
        setSeccionesEnBuses((prev) => prev.filter((s) => s !== seccion_core));
      } else {
        const res = await fetch("/api/admin/buses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seccion_core }),
        });
        if (!res.ok) {
          setError("Error al marcar subida a buses");
          return;
        }
        setSeccionesEnBuses((prev) => [...prev, seccion_core].sort());
      }
    } finally {
      setTogglingBuses(null);
    }
  }

  async function toggleAlmuerzo(seccion_core: string) {
    setTogglingAlmuerzo(seccion_core);
    setError("");
    try {
      const estaEntregado = seccionesAlmuerzoEntregado.includes(seccion_core);
      if (estaEntregado) {
        const res = await fetch(`/api/admin/almuerzo-entregado?seccion_core=${encodeURIComponent(seccion_core)}`, { method: "DELETE" });
        if (!res.ok) {
          setError("Error al quitar marca de almuerzo entregado");
          return;
        }
        setSeccionesAlmuerzoEntregado((prev) => prev.filter((s) => s !== seccion_core));
      } else {
        const res = await fetch("/api/admin/almuerzo-entregado", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seccion_core }),
        });
        if (!res.ok) {
          setError("Error al marcar almuerzo entregado");
          return;
        }
        setSeccionesAlmuerzoEntregado((prev) => [...prev, seccion_core].sort());
      }
    } finally {
      setTogglingAlmuerzo(null);
    }
  }

  const filtered =
    tab === "registrados"
      ? personas.filter((p) => p.asistencia)
      : tab === "sin-registrar"
        ? personas.filter((p) => !p.asistencia)
        : personas;

  const carrerasExistentes = Array.from(new Set(personas.map((p) => p.carrera).filter((c): c is string => !!c))).sort();

  const porSeccionRestriccion: Record<string, { vegetariano_vegano: number; celiaco: number }> = {};
  const seccionesUnicas = Array.from(new Set(personas.map((p) => p.seccion_core).filter((s): s is string => !!s)));
  for (const sec of seccionesUnicas) porSeccionRestriccion[sec] = { vegetariano_vegano: 0, celiaco: 0 };
  for (const p of personas) {
    if (!p.asistencia) continue;
    const sec = p.seccion_core;
    const r = p.asistencia.restriccion_alimentaria;
    if (r === "vegetariano" || r === "vegano" || r === "vegetariano_vegano") porSeccionRestriccion[sec].vegetariano_vegano += 1;
    else if (r === "celiaco") porSeccionRestriccion[sec].celiaco += 1;
  }
  const seccionesParaRestriccion = Object.keys(porSeccionRestriccion).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const term = busquedaApellido.trim().toLowerCase();
  const filteredByApellido = term
    ? filtered.filter(
        (p) =>
          p.apellido_paterno.toLowerCase().includes(term) || p.apellido_materno.toLowerCase().includes(term)
      )
    : filtered;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sky-600 hover:underline font-medium">
              ← Inicio
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Panel Administrador</h1>
          </div>
          <button
            onClick={logout}
            className="text-slate-500 hover:text-slate-700 text-sm font-medium"
          >
            Cerrar sesión
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-slate-500 text-sm">Total personas</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total_personas}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-slate-500 text-sm">Registrados</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.total_registrados}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-slate-500 text-sm">Sin registrar</p>
              <p className="text-2xl font-bold text-amber-600">{stats.total_sin_registrar}</p>
            </div>
          </div>
        )}

        {/* Por sección y por carrera */}
        {stats && (Object.keys(stats.por_seccion).length > 0 || Object.keys(stats.por_carrera || {}).length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {Object.keys(stats.por_seccion).length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-800 mb-3">Por sección CORE</h2>
                <p className="text-xs text-slate-500 mb-3">Marque cuando la sección ya se haya subido a los buses.</p>
                <div className="max-h-[500px] overflow-auto overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="pb-2 pt-1 pr-4 bg-slate-50">Sección</th>
                        <th className="pb-2 pt-1 pr-4 bg-slate-50">Total</th>
                        <th className="pb-2 pt-1 pr-4 bg-slate-50">Registrados</th>
                        <th className="pb-2 pt-1 bg-slate-50">Buses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.por_seccion).map(([sec, { total, registrados }]) => (
                        <tr key={sec} className="border-b border-slate-100">
                          <td className="py-2 pr-4 font-medium text-slate-800">{sec}</td>
                          <td className="py-2 pr-4">{total}</td>
                          <td className="py-2 pr-4 text-emerald-600">{registrados}</td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => toggleBuses(sec)}
                              disabled={togglingBuses === sec}
                              title={seccionesEnBuses.includes(sec) ? "Quitar marca de subida a buses" : "Marcar como subida a buses"}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                                seccionesEnBuses.includes(sec)
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                              } disabled:opacity-50`}
                            >
                              {togglingBuses === sec ? "…" : seccionesEnBuses.includes(sec) ? "✓ Subida" : "Marcar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {stats.por_carrera && Object.keys(stats.por_carrera).length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="font-semibold text-slate-800 mb-3">Por carrera</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="pb-2 pr-4">Carrera</th>
                        <th className="pb-2 pr-4">Total</th>
                        <th className="pb-2">Registrados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.por_carrera).map(([car, { total, registrados }]) => (
                        <tr key={car} className="border-b border-slate-100">
                          <td className="py-2 pr-4 font-medium text-slate-800">{car}</td>
                          <td className="py-2 pr-4">{total}</td>
                          <td className="py-2 text-emerald-600">{registrados}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Restricciones por sección CORE */}
        {seccionesParaRestriccion.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
            <h2 className="font-semibold text-slate-800 mb-3">Restricciones por sección CORE</h2>
            <p className="text-sm text-slate-500 mb-3">
              Personas registradas con restricción alimentaria, por sección. Marque cuando ya se haya entregado el almuerzo especial a esa sección.
            </p>
            <div className="max-h-[500px] overflow-auto overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 pt-1 pr-4 bg-slate-50">Sección CORE</th>
                    <th className="pb-2 pt-1 pr-4 bg-slate-50">Vegetariano/vegano</th>
                    <th className="pb-2 pt-1 pr-4 bg-slate-50">Celíaco</th>
                    <th className="pb-2 pt-1 bg-slate-50">Almuerzo entregado</th>
                  </tr>
                </thead>
                <tbody>
                  {seccionesParaRestriccion.map((sec) => (
                    <tr key={sec} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-800">{sec}</td>
                      <td className="py-2 pr-4">{porSeccionRestriccion[sec].vegetariano_vegano}</td>
                      <td className="py-2 pr-4">{porSeccionRestriccion[sec].celiaco}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => toggleAlmuerzo(sec)}
                          disabled={togglingAlmuerzo === sec}
                          title={seccionesAlmuerzoEntregado.includes(sec) ? "Quitar marca de almuerzo entregado" : "Marcar almuerzo entregado"}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                            seccionesAlmuerzoEntregado.includes(sec)
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          } disabled:opacity-50`}
                        >
                          {togglingAlmuerzo === sec ? "…" : seccionesAlmuerzoEntregado.includes(sec) ? "✓ Entregado" : "Marcar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Restricciones alimentarias */}
        {stats?.por_restriccion && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
            <h2 className="font-semibold text-slate-800 mb-3">Restricciones alimentarias</h2>
            <p className="text-sm text-slate-500 mb-3">
              Personas registradas que indicaron cada tipo de restricción.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 pr-4">Restricción</th>
                    <th className="pb-2">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "ninguna", label: "Ninguna" },
                    { key: "celiaco", label: "Celíaco" },
                    { key: "vegetariano_vegano", label: "Vegetariano/vegano" },
                  ].map(({ key, label }) => (
                    <tr key={key} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-800">{label}</td>
                      <td className="py-2">{stats.por_restriccion[key] ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-8">
          <h2 className="font-semibold text-slate-800 mb-3">Cargar archivo XLS</h2>
          <p className="text-sm text-slate-500 mb-3">
            Columnas esperadas: RUT, DV, nombres, apellido paterno, apellido materno, correo UAI, sección CORE, carrera.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <form onSubmit={upload} className="flex flex-wrap items-end gap-3">
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <button
                type="submit"
                disabled={!uploadFile || uploading}
                className="px-4 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 disabled:opacity-50"
              >
                {uploading ? "Subiendo…" : "Subir"}
              </button>
            </form>
            <button
              type="button"
              onClick={eliminarTodaLaLista}
              disabled={vaciendo || personas.length === 0}
              className="px-4 py-2 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50 disabled:opacity-50 disabled:border-slate-200 disabled:text-slate-400"
              title="Eliminar todas las personas para subir otra lista"
            >
              {vaciendo ? "Eliminando…" : "Eliminar toda la lista"}
            </button>
          </div>
        </div>

        {/* Add manual */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700"
          >
            Añadir persona manualmente
          </button>
        </div>

        {/* Tabs + Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            {(["todos", "registrados", "sin-registrar"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-3 text-sm font-medium ${
                  tab === t
                    ? "text-sky-600 border-b-2 border-sky-500 bg-sky-50/50"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                {t === "todos" ? "Todos" : t === "registrados" ? "Registrados" : "Sin registrar"}
              </button>
            ))}
          </div>

          {!loading && (
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
              <label className="sr-only" htmlFor="buscar-apellido">
                Buscar por apellido
              </label>
              <input
                id="buscar-apellido"
                type="text"
                value={busquedaApellido}
                onChange={(e) => setBusquedaApellido(e.target.value)}
                placeholder="Buscar por apellido paterno o materno…"
                className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-500">Cargando…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3">RUT</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Carrera</th>
                    <th className="px-4 py-3">Sección</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Restricción</th>
                    <th className="px-4 py-3 min-w-[11rem]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredByApellido.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono">
                        {p.rut}-{p.dv}
                      </td>
                      <td className="px-4 py-3">
                        {p.nombres} {p.apellido_paterno} {p.apellido_materno}
                      </td>
                      <td className="px-4 py-3">{p.carrera || "—"}</td>
                      <td className="px-4 py-3">{p.seccion_core}</td>
                      <td className="px-4 py-3">
                        {p.asistencia ? (
                          <span className="text-emerald-600 font-medium">Registrado</span>
                        ) : (
                          <span className="text-amber-600">Sin registrar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.asistencia?.restriccion_alimentaria &&
                        p.asistencia.restriccion_alimentaria !== "ninguna"
                          ? p.asistencia.restriccion_alimentaria === "celiaco"
                            ? "Celíaco"
                            : p.asistencia.restriccion_alimentaria === "vegetariano_vegano" ||
                                p.asistencia.restriccion_alimentaria === "vegano" ||
                                p.asistencia.restriccion_alimentaria === "vegetariano"
                              ? "Vegetariano/vegano"
                              : p.asistencia.restriccion_alimentaria.replace("_", " ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setEditId(p.id)}
                            className="text-sky-600 hover:underline font-medium"
                          >
                            Editar
                          </button>
                          {p.asistencia && (
                            <button
                              onClick={() => quitarRegistro(p.id)}
                              disabled={quitandoId === p.id}
                              className="text-amber-600 hover:underline font-medium disabled:opacity-50"
                              title="Quitar registro de asistencia (la persona sigue en la lista)"
                            >
                              {quitandoId === p.id ? "…" : "Quitar registro"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredByApellido.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  {filtered.length === 0 ? "No hay registros" : "Ningún resultado para ese apellido"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {addOpen && (
        <AddPersonaModal
          carrerasExistentes={carrerasExistentes}
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            load();
          }}
        />
      )}
      {editId && (
        <EditPersonaModal
          persona={personas.find((p) => p.id === editId)!}
          onClose={() => setEditId(null)}
          onSaved={() => {
            setEditId(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddPersonaModal({
  carrerasExistentes,
  onClose,
  onSaved,
}: {
  carrerasExistentes: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    rut: "",
    dv: "",
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    correo_uai: "",
    seccion_core: "",
    carrera: "",
  });
  const [restriccionAlimentaria, setRestriccionAlimentaria] = useState<"ninguna" | "celiaco" | "vegetariano">("ninguna");
  const [carreraOtra, setCarreraOtra] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          correo_uai: form.correo_uai || undefined,
          carrera: form.carrera || carreraOtra.trim() || undefined,
          restriccion_alimentaria: restriccionAlimentaria,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Añadir persona</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">RUT</label>
              <input
                value={form.rut}
                onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">DV</label>
              <input
                value={form.dv}
                onChange={(e) => setForm((f) => ({ ...f, dv: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombres</label>
            <input
              value={form.nombres}
              onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ap. paterno</label>
              <input
                value={form.apellido_paterno}
                onChange={(e) => setForm((f) => ({ ...f, apellido_paterno: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ap. materno</label>
              <input
                value={form.apellido_materno}
                onChange={(e) => setForm((f) => ({ ...f, apellido_materno: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Correo UAI</label>
            <input
              type="email"
              value={form.correo_uai}
              onChange={(e) => setForm((f) => ({ ...f, correo_uai: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sección CORE</label>
            <input
              value={form.seccion_core}
              onChange={(e) => setForm((f) => ({ ...f, seccion_core: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Restricción alimentaria</label>
            <select
              value={restriccionAlimentaria}
              onChange={(e) => setRestriccionAlimentaria(e.target.value as "ninguna" | "celiaco" | "vegetariano")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ninguna">Ninguna</option>
              <option value="celiaco">Celíaco</option>
              <option value="vegetariano">Vegetariano/vegano</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Carrera</label>
            <select
              value={form.carrera}
              onChange={(e) => setForm((f) => ({ ...f, carrera: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Otra (escribir)</option>
              {carrerasExistentes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {form.carrera === "" && (
              <input
                type="text"
                value={carreraOtra}
                onChange={(e) => setCarreraOtra(e.target.value)}
                placeholder="Escribir carrera"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPersonaModal({
  persona,
  onClose,
  onSaved,
}: {
  persona: PersonaRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    rut: persona.rut,
    dv: persona.dv,
    nombres: persona.nombres,
    apellido_paterno: persona.apellido_paterno,
    apellido_materno: persona.apellido_materno,
    correo_uai: persona.correo_uai ?? "",
    seccion_core: persona.seccion_core,
    carrera: persona.carrera ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/personas/${persona.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          correo_uai: form.correo_uai || null,
          carrera: form.carrera || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Editar persona</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">RUT</label>
              <input
                value={form.rut}
                onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">DV</label>
              <input
                value={form.dv}
                onChange={(e) => setForm((f) => ({ ...f, dv: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nombres</label>
            <input
              value={form.nombres}
              onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ap. paterno</label>
              <input
                value={form.apellido_paterno}
                onChange={(e) => setForm((f) => ({ ...f, apellido_paterno: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ap. materno</label>
              <input
                value={form.apellido_materno}
                onChange={(e) => setForm((f) => ({ ...f, apellido_materno: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Correo UAI</label>
            <input
              type="email"
              value={form.correo_uai}
              onChange={(e) => setForm((f) => ({ ...f, correo_uai: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sección CORE</label>
            <input
              value={form.seccion_core}
              onChange={(e) => setForm((f) => ({ ...f, seccion_core: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Carrera</label>
            <input
              value={form.carrera}
              onChange={(e) => setForm((f) => ({ ...f, carrera: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ej: Ingeniería Civil"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
