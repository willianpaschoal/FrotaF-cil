import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Vehicle } from '../types';
import {
  AlertTriangle,
  Wrench,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  PlusCircle,
  Settings2,
  ShieldAlert,
  Gauge,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MaintenanceAlertsProps {
  onOpenExpenses?: () => void;
}

export const MaintenanceAlerts: React.FC<MaintenanceAlertsProps> = ({ onOpenExpenses }) => {
  const { vehicles, recordVehicleMaintenance, updateVehicle, setActiveTab } = useFleet();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [selectedVehicleForService, setSelectedVehicleForService] = useState<Vehicle | null>(null);
  const [selectedVehicleForAdjust, setSelectedVehicleForAdjust] = useState<Vehicle | null>(null);

  // Form states for service modal
  const [performedKm, setPerformedKm] = useState<number>(0);
  const [nextLimitKm, setNextLimitKm] = useState<number>(0);
  const [expenseAmount, setExpenseAmount] = useState<string>('350.00');
  const [expenseNotes, setExpenseNotes] = useState<string>('Troca de óleo, filtros e revisão geral');
  const [createExpense, setCreateExpense] = useState<boolean>(true);

  // Form states for adjust threshold modal
  const [adjustLimitKm, setAdjustLimitKm] = useState<number>(0);
  const [adjustIntervalKm, setAdjustIntervalKm] = useState<number>(10000);

  // Calculate status for each vehicle
  const vehicleStatuses = vehicles.map((v) => {
    const currentKm = v.kmCurrent || 0;
    const limitKm = v.nextMaintenanceKm || (Math.ceil(Math.max(currentKm, 10000) / 10000) * 10000);
    const diff = currentKm - limitKm;
    const isOverdue = currentKm >= limitKm;
    const isWarning = !isOverdue && (limitKm - currentKm <= 2000);
    const progressPercent = Math.min(100, Math.round((currentKm / limitKm) * 100));

    return {
      vehicle: v,
      currentKm,
      limitKm,
      diff,
      isOverdue,
      isWarning,
      isOk: !isOverdue && !isWarning,
      progressPercent,
      remainingKm: Math.max(0, limitKm - currentKm),
      exceededKm: Math.max(0, currentKm - limitKm),
    };
  });

  const overdueCount = vehicleStatuses.filter((s) => s.isOverdue).length;
  const warningCount = vehicleStatuses.filter((s) => s.isWarning).length;
  const alertVehicles = vehicleStatuses.filter((s) => s.isOverdue || s.isWarning);
  const hasAlerts = alertVehicles.length > 0;

  const handleOpenServiceModal = (v: Vehicle, currentKm: number, limitKm: number) => {
    setSelectedVehicleForService(v);
    setPerformedKm(currentKm);
    // Suggest next limit adding the interval (default 10.000 km)
    const interval = v.maintenanceIntervalKm || 10000;
    setNextLimitKm(currentKm + interval);
    setExpenseAmount('450.00');
    setExpenseNotes('Troca de óleo, filtro de combustível e revisão periódica');
    setCreateExpense(true);
  };

  const handleConfirmService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForService) return;

    recordVehicleMaintenance(selectedVehicleForService.id, {
      performedKm: Number(performedKm) || selectedVehicleForService.kmCurrent,
      nextLimitKm: Number(nextLimitKm) || (Number(performedKm) + 10000),
      maintenanceIntervalKm: selectedVehicleForService.maintenanceIntervalKm || 10000,
      expenseAmount: createExpense ? parseFloat(expenseAmount.replace(',', '.')) || 0 : 0,
      expenseNotes: createExpense ? expenseNotes : undefined,
    });

    setSelectedVehicleForService(null);
  };

  const handleOpenAdjustModal = (v: Vehicle, limitKm: number) => {
    setSelectedVehicleForAdjust(v);
    setAdjustLimitKm(limitKm);
    setAdjustIntervalKm(v.maintenanceIntervalKm || 10000);
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForAdjust) return;

    updateVehicle(selectedVehicleForAdjust.id, {
      nextMaintenanceKm: Number(adjustLimitKm),
      maintenanceIntervalKm: Number(adjustIntervalKm),
    });

    setSelectedVehicleForAdjust(null);
  };

  return (
    <section className="w-full flex flex-col gap-3">
      {/* Alert Header Banner */}
      <div
        className={`rounded-2xl p-4 border transition-all duration-300 shadow-md ${
          overdueCount > 0
            ? 'bg-gradient-to-r from-rose-950/40 via-[#19131C] to-[#14151E] border-rose-500/40'
            : warningCount > 0
            ? 'bg-gradient-to-r from-amber-950/30 via-[#1A1713] to-[#14151E] border-amber-500/40'
            : 'bg-[#14151E] border-white/5'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Animated Icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                overdueCount > 0
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : warningCount > 0
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {overdueCount > 0 ? (
                <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
              ) : warningCount > 0 ? (
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  Alertas de Manutenção
                </h3>
                {overdueCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider animate-bounce">
                    {overdueCount} {overdueCount === 1 ? 'Vencida' : 'Vencidas'}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-[10px] rounded-full uppercase tracking-wider">
                    {warningCount} {warningCount === 1 ? 'Próxima' : 'Próximas'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasAlerts
                  ? `${overdueCount > 0 ? 'Veículo atingiu o limite de KM para revisão.' : 'Veículo próximo da quilometragem limite.'}`
                  : 'Todos os veículos estão com a manutenção em dia.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {hasAlerts && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title={isExpanded ? 'Recolher alertas' : 'Expandir alertas'}
                aria-label={isExpanded ? 'Recolher alertas' : 'Expandir alertas'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Action button if no alerts */}
        {!hasAlerts && (
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px] flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Nenhum veículo necessita de revisão imediata
            </span>
            <button
              type="button"
              onClick={() => setShowAllVehicles(!showAllVehicles)}
              className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px] hover:underline"
            >
              {showAllVehicles ? 'Ocultar status da frota' : 'Ver status de todos os veículos'}
            </button>
          </div>
        )}

        {/* Alert Cards Body */}
        <AnimatePresence>
          {(isExpanded || showAllVehicles) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3.5 pt-3 border-t border-white/10 flex flex-col gap-2.5 overflow-hidden"
            >
              {(hasAlerts ? (showAllVehicles ? vehicleStatuses : alertVehicles) : (showAllVehicles ? vehicleStatuses : [])).map((status) => {
                const { vehicle, currentKm, limitKm, isOverdue, isWarning, exceededKm, remainingKm, progressPercent } = status;

                return (
                  <div
                    key={vehicle.id}
                    className={`rounded-xl p-3 border transition-all flex flex-col gap-2.5 ${
                      isOverdue
                        ? 'bg-rose-950/25 border-rose-500/30'
                        : isWarning
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-[#181A22] border-white/5'
                    }`}
                  >
                    {/* Header vehicle row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-slate-800">
                          <img
                            src={vehicle.image}
                            alt={vehicle.model}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white tracking-wide uppercase">
                              {vehicle.plate}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {vehicle.model}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isOverdue ? (
                              <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                Limite atingido! Excedeu em {exceededKm.toLocaleString('pt-BR')} km
                              </span>
                            ) : isWarning ? (
                              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Revisão próxima! Restam {remainingKm.toLocaleString('pt-BR')} km
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Manutenção em dia (Faltam {remainingKm.toLocaleString('pt-BR')} km)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isOverdue ? 'Revisão Urgente' : isWarning ? 'Atenção' : 'Em Dia'}
                      </span>
                    </div>

                    {/* Progress Bar & Indicators */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-300">
                        <span className="flex items-center gap-1 text-slate-400 font-mono">
                          <Gauge className="w-3 h-3 text-indigo-400" />
                          Atual: <strong className="text-white">{currentKm.toLocaleString('pt-BR')} km</strong>
                        </span>
                        <span className="font-mono text-slate-400">
                          Limite: <strong className={isOverdue ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-200'}>{limitKm.toLocaleString('pt-BR')} km</strong>
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverdue
                              ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                              : isWarning
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, progressPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleOpenServiceModal(vehicle, currentKm, limitKm)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer ${
                          isOverdue
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Registrar Revisão
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAdjustModal(vehicle, limitKm)}
                        className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors border border-white/5 cursor-pointer"
                        title="Ajustar quilometragem limite"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ajustar Limite</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('expenses');
                          onOpenExpenses?.();
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors border border-white/5 cursor-pointer"
                        title="Ver Despesas da Frota"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden sm:inline">Despesas</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {hasAlerts && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAllVehicles(!showAllVehicles)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-indigo-300 hover:underline"
                  >
                    {showAllVehicles ? 'Mostrar apenas veículos com alerta' : 'Ver todos os veículos da frota'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal 1: Registrar Manutenção / Revisão Concluída */}
      {selectedVehicleForService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14161F] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registrar Revisão</h3>
                  <p className="text-xs text-slate-400">
                    {selectedVehicleForService.model} ({selectedVehicleForService.plate})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicleForService(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmService} className="flex flex-col gap-3.5">
              {/* Informações de KM */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    KM da Realização
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={performedKm}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setPerformedKm(val);
                      setNextLimitKm(val + (selectedVehicleForService.maintenanceIntervalKm || 10000));
                    }}
                    className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-mono font-semibold text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Hodômetro atual
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-indigo-300 mb-1 block">
                    Próximo Limite (KM)
                  </label>
                  <input
                    type="number"
                    required
                    min={performedKm + 1}
                    value={nextLimitKm}
                    onChange={(e) => setNextLimitKm(Number(e.target.value) || 0)}
                    className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-mono font-bold text-indigo-400 focus:outline-none border border-indigo-500/30"
                  />
                  <span className="text-[10px] text-indigo-400/80 mt-1 block">
                    +{(nextLimitKm - performedKm).toLocaleString('pt-BR')} km até a próxima
                  </span>
                </div>
              </div>

              {/* Checkbox Criar Despesa */}
              <div className="p-3 rounded-2xl bg-[#1B1E28] border border-white/5 flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createExpense}
                    onChange={(e) => setCreateExpense(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-[#12141C] border-white/20 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-white">
                    Lançar como despesa de Manutenção
                  </span>
                </label>

                {createExpense && (
                  <div className="flex flex-col gap-2.5 pt-2 border-t border-white/5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                        Valor da Manutenção (R$)
                      </label>
                      <input
                        type="text"
                        required={createExpense}
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        placeholder="0,00"
                        className="inset-input w-full px-3 py-2 rounded-xl bg-[#12141C] text-sm font-bold text-emerald-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                        Descrição do Serviço Realizado
                      </label>
                      <input
                        type="text"
                        value={expenseNotes}
                        onChange={(e) => setExpenseNotes(e.target.value)}
                        placeholder="Ex: Troca de óleo, pastilhas de freio..."
                        className="inset-input w-full px-3 py-2 rounded-xl bg-[#12141C] text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVehicleForService(null)}
                  className="flex-1 py-3 rounded-xl bg-[#1E2129] hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <Check className="w-4 h-4" />
                  Concluir Manutenção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Ajustar Limite de Manutenção */}
      {selectedVehicleForAdjust && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14161F] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Ajustar Limite de KM</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicleForAdjust(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="flex flex-col gap-3.5">
              <div className="p-3 bg-[#1B1E28] rounded-2xl border border-white/5 text-xs text-slate-300">
                Veículo: <strong className="text-white">{selectedVehicleForAdjust.model}</strong>
                <br />
                Placa: <span className="font-mono text-indigo-400 font-bold">{selectedVehicleForAdjust.plate}</span>
                <br />
                KM Atual: <span className="font-mono font-bold text-white">{selectedVehicleForAdjust.kmCurrent.toLocaleString('pt-BR')} km</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">
                  Novo Limite para Próxima Revisão (KM)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustLimitKm}
                  onChange={(e) => setAdjustLimitKm(Number(e.target.value) || 0)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-mono font-bold text-white focus:outline-none border border-white/10"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Quando o veículo atingir esse valor, o alerta disparará na Dashboard.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">
                  Intervalo Padrão entre Revisões (KM)
                </label>
                <input
                  type="number"
                  required
                  step={1000}
                  min={1000}
                  value={adjustIntervalKm}
                  onChange={(e) => setAdjustIntervalKm(Number(e.target.value) || 10000)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-mono font-semibold text-white focus:outline-none border border-white/10"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ex: 10.000 km (usado para calcular o próximo ciclo)
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVehicleForAdjust(null)}
                  className="flex-1 py-3 rounded-xl bg-[#1E2129] hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Salvar Limite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
