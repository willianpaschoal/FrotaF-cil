import React from 'react';
import { useFleet } from '../context/FleetContext';
import { Eye, EyeOff, Truck } from 'lucide-react';

export const Header: React.FC = () => {
  const { driverProfile, togglePrivacy } = useFleet();

  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-5 h-14 bg-[#0A0A0B]/80 text-white shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 border border-indigo-400/40 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
          <Truck className="w-4 h-4" />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-bold text-base text-white tracking-tight">
              FrotaFácil
            </span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
              v1.8.8
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 leading-tight truncate max-w-[160px] sm:max-w-[220px]">
            {driverProfile.name}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={togglePrivacy}
        aria-label="Alternar visibilidade dos saldos"
        title={driverProfile.privacyHideFinancials ? "Mostrar valores" : "Ocultar valores"}
        className="p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95 duration-200 text-slate-300 flex items-center justify-center"
      >
        {driverProfile.privacyHideFinancials ? (
          <Eye className="w-5 h-5 text-indigo-400" />
        ) : (
          <EyeOff className="w-5 h-5 text-slate-500" />
        )}
      </button>
    </header>
  );
};
