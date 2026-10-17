import React, { useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "Sam18101998&&&&";

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD) {
      localStorage.setItem("coc_admin_session", Date.now().toString());
      window.location.href = "/admin/dashboard";
    } else {
      setError("كلمة مرور خاطئة");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md bg-[#121212] border border-[#27272a] rounded-3xl p-8 shadow-2xl space-y-6 text-center">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center mx-auto border border-[#F59E0B]/20">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            ClashOfCoin Admin Access
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1.5 font-mono">
            Restricted Area · Authorization Required
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-2xl text-xs font-bold text-[#F87171] flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-start">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full px-4 py-3.5 bg-[#1c1c1f] border border-[#3f3f46] rounded-2xl text-sm text-white placeholder-[#71717a] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] py-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold text-base rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>دخول</span>
          </button>
        </form>

        <div className="pt-2">
          <a
            href="/"
            className="text-xs text-[#71717a] hover:text-[#a1a1aa] transition-colors cursor-pointer"
          >
            ← العودة إلى الموقع الرئيسي
          </a>
        </div>
      </div>
    </div>
  );
}
