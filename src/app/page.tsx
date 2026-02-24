import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-sky-50">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Registro de Asistencia
        </h1>
        <p className="text-slate-600 mb-10">Mechoneo</p>

        <div className="flex flex-col gap-4">
          <Link
            href="/usuario"
            className="block w-full py-4 px-6 rounded-xl bg-sky-500 text-white font-semibold shadow-lg shadow-sky-500/30 hover:bg-sky-600 transition"
          >
            Acceso Usuario
          </Link>
          <Link
            href="/admin"
            className="block w-full py-4 px-6 rounded-xl bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition"
          >
            Acceso Administrador
          </Link>
        </div>
      </div>
    </div>
  );
}
