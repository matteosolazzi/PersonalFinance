import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "./login-button";
import { Wallet } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="text-slate-400 text-sm mt-1">Il tuo patrimonio sotto controllo</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
          <h2 className="text-white font-semibold text-lg mb-1">Accedi</h2>
          <p className="text-slate-400 text-sm mb-6">Usa il tuo account Google per continuare</p>
          <LoginButton />
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Accesso riservato — solo account autorizzati
        </p>
      </div>
    </div>
  );
}
