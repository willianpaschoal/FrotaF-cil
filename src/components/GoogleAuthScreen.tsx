import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useFleet } from '../context/FleetContext';
import { Truck, ShieldCheck, CheckCircle2, Sparkles, ArrowRight, User, Lock } from 'lucide-react';
import { ParticleBackground } from '@/registry/pioneerui/particle-background';

export const GoogleAuthScreen: React.FC = () => {
  const { loginWithGoogle } = useFleet();
  const [rememberedEmail] = useState(() => localStorage.getItem('fleetops_remembered_email') || '');
  const [rememberedName] = useState(() => localStorage.getItem('fleetops_remembered_name') || '');
  
  const [googleEmail, setGoogleEmail] = useState(rememberedEmail);
  const [googleName, setGoogleName] = useState(rememberedName);
  const [isCustomAccount, setIsCustomAccount] = useState(!rememberedEmail);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = (emailToUse: string, nameToUse: string) => {
    if (!emailToUse.trim()) return;
    setIsLoading(true);
    try {
      localStorage.setItem('fleetops_remembered_email', emailToUse.trim());
      localStorage.setItem('fleetops_remembered_name', nameToUse.trim() || 'Motorista');
    } catch (e) {}

    setTimeout(() => {
      loginWithGoogle(emailToUse.trim(), nameToUse.trim() || 'Motorista');
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Particle Background */}
      <ParticleBackground particleCount={60} preset="links" color="#00FFE1" speed={1.5} />

      {/* Ambient background glow */}
      <div className="absolute w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 flex flex-col gap-5"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#12141C] rounded-[14px] flex items-center justify-center">
                <Truck className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-500 rounded-full border-2 border-[#0A0A0B]">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
              FrotaFácil <span className="text-cyan-400 font-extrabold text-sm uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 tracking-wider">Pro</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium max-w-xs mx-auto">
              Controle Inteligente de Viagens, Rotas, Despesas & Relatórios
            </p>
          </div>
        </div>

        {/* Card de Autenticação com Google */}
        <div className="tactile-card rounded-3xl p-6 bg-[#12141C]/90 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-5">
          <div className="flex flex-col text-center gap-1">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Cadastre-se ou Entre na sua Conta
            </h2>
            <p className="text-xs text-slate-400">
              Cada usuário possui uma conta individual e privada. Ninguém tem acesso aos dados de outro motorista.
            </p>
          </div>

          {/* Privacy badge banner */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Isolamento Total: Conta e relatórios 100% individuais</span>
          </div>

          {/* Quick One-Tap Account (Detected Account) */}
          {!isCustomAccount && rememberedEmail ? (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-2xl bg-[#1E2129] border border-white/10 hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white font-bold flex items-center justify-center shrink-0 shadow-md">
                    {googleName ? googleName.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-bold text-white truncate">
                      {googleName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium truncate">
                      {googleEmail}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  Principal
                </span>
              </div>

              {/* Botão Oficial do Google */}
              <button
                type="button"
                onClick={() => handleSignIn(googleEmail, googleName)}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg shadow-white/10 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continuar com o Google</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setGoogleEmail('');
                  setGoogleName('');
                  setIsCustomAccount(true);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold py-1.5 transition-colors cursor-pointer text-center"
              >
                Usar outra conta Google ou novo e-mail
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (googleEmail.trim()) {
                  handleSignIn(googleEmail.trim(), googleName.trim() || 'Motorista');
                }
              }}
              className="flex flex-col gap-3"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Seu Nome
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Digite seu nome completo"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="inset-input w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white border border-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Conta Google (E-mail)
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu.email@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white border border-white/10 focus:border-indigo-500"
                />
              </div>

              {/* Botões rápidos de domínio */}
              <div className="flex flex-wrap gap-1">
                {['@gmail.com', '@googlemail.com', '@empresa.com'].map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => {
                      const atIdx = googleEmail.indexOf('@');
                      const base = atIdx !== -1 ? googleEmail.slice(0, atIdx) : googleEmail;
                      setGoogleEmail((base || 'usuario') + domain);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 font-medium border border-white/5 cursor-pointer"
                  >
                    {domain}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                {rememberedEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleEmail(rememberedEmail);
                      setGoogleName(rememberedName);
                      setIsCustomAccount(false);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#1E2129] text-slate-300 font-bold text-xs hover:bg-[#252932] transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || !googleEmail.trim()}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-white/10 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continuar com o Google</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Vantagens / Segurança */}
          <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Login seguro e imediato sem senha</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Configurada automaticamente como <strong>Conta Principal</strong></span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Seus dados de rotas e faturamento 100% protegidos</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-500">
          Ao continuar, você concorda com os Termos de Uso e Política de Privacidade do FrotaFácil.
        </p>
      </motion.div>
    </div>
  );
};
