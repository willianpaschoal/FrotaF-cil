import React, { useState, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { JobClassification, ServiceCategory } from '../types';
import { getPreviousDayFinalKm } from '../utils/odometer';
import {
  Search,
  PlusCircle,
  Save,
  CheckCircle2,
  Calendar,
  Clock,
  Truck,
  Edit2,
  Users,
  ChevronLeft,
} from 'lucide-react';

interface JobFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const JobForm: React.FC<JobFormProps> = ({ onSuccess, onCancel }) => {
  const { jobs, clients, vehicles, driverProfile, addJob, addClient, updateProfile, setActiveTab } = useFleet();

  // Form State
  const [clientName, setClientName] = useState(clients[0]?.name || 'Logística Express S.A.');
  const [classification, setClassification] = useState<JobClassification>('normal');

  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const defaultVeh =
    vehicles.find((v) => v.plate === driverProfile.defaultVehiclePlate) || vehicles[0];
  const defaultVehicleStr = defaultVeh
    ? `${defaultVeh.model} (${defaultVeh.plate})`
    : 'Mercedes Benz Sprinter (ABC-1234)';
  const [selectedVehicle, setSelectedVehicle] = useState(defaultVehicleStr);

  const [isKmInitialManual, setIsKmInitialManual] = useState(false);
  const [kmInitial, setKmInitial] = useState<number | ''>(() =>
    getPreviousDayFinalKm(jobs, todayStr, defaultVehicleStr, vehicles)
  );
  const [kmFinal, setKmFinal] = useState<number | ''>('');

  // Atualiza kmInitial com o KM final do card do dia anterior quando veículo, data ou trabalhos mudam
  useEffect(() => {
    if (!isKmInitialManual) {
      const prevKm = getPreviousDayFinalKm(jobs, startDate, selectedVehicle, vehicles);
      if (prevKm !== '') {
        setKmInitial(prevKm);
      }
    }
  }, [selectedVehicle, startDate, jobs, vehicles, isKmInitialManual]);

  const handleStartDateChange = (newDate: string) => {
    setStartDate(newDate);
    if (!isKmInitialManual) {
      const prevKm = getPreviousDayFinalKm(jobs, newDate, selectedVehicle, vehicles);
      if (prevKm !== '') {
        setKmInitial(prevKm);
      }
    }
  };

  const handleVehicleChange = (newVehStr: string) => {
    setSelectedVehicle(newVehStr);
    setIsKmInitialManual(false);
    const prevKm = getPreviousDayFinalKm(jobs, startDate, newVehStr, vehicles);
    if (prevKm !== '') {
      setKmInitial(prevKm);
    }
  };

  const [peopleCount, setPeopleCount] = useState<number>(
    driverProfile.lastPeopleCount || 1
  );
  const [serviceType, setServiceType] = useState<ServiceCategory>(
    driverProfile.defaultServiceType || 'CARGA'
  );
  const [amount, setAmount] = useState<string>(driverProfile.defaultJobValue.toFixed(2));
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<'PJ' | 'PF'>('PJ');

  const calculatedKmTotal =
    typeof kmInitial === 'number' && typeof kmFinal === 'number' && kmFinal >= kmInitial
      ? kmFinal - kmInitial
      : 0;

  const handleAddQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    addClient({
      name: newClientName.trim(),
      type: newClientType,
      autoFill: true,
    });
    setClientName(newClientName.trim());
    setNewClientName('');
    setShowNewClientModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
    const initialKmNum = typeof kmInitial === 'number' ? kmInitial : 0;
    const finalKmNum = typeof kmFinal === 'number' ? kmFinal : initialKmNum + calculatedKmTotal;

    setTimeout(() => {
      // Always save last selected people count for future jobs
      updateProfile({ lastPeopleCount: peopleCount });

      addJob({
        title: `Serviço - ${clientName}`,
        clientName,
        routeFrom: 'Origem Informada',
        routeTo: 'Destino Final',
        startDate,
        startTime,
        endDate,
        endTime,
        kmInitial: initialKmNum,
        kmFinal: finalKmNum,
        kmTotal: calculatedKmTotal,
        vehicleModel: selectedVehicle,
        vehiclePlate: selectedVehicle.match(/\(([^)]+)\)/)?.[1] || 'ABC-1234',
        peopleCount,
        serviceType,
        amount: parsedAmount,
        classification,
        status: endDate || endTime ? 'Finalizado' : 'Em Trânsito',
        notes,
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        if (onSuccess) {
          onSuccess();
        } else {
          setActiveTab('dashboard');
        }
      }, 1200);
    }, 1000);
  };

  return (
    <div className="pt-18 pb-28 px-5 max-w-lg mx-auto flex flex-col gap-5">
      {/* Top Title & Back */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Registrar Trabalho</h2>
          <p className="text-xs text-slate-400 mt-0.5">Preencha os detalhes do serviço realizado.</p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-[#1E2129]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Section: Cliente & Classificação */}
        <div className="tactile-card rounded-2xl p-5 flex flex-col gap-4 border border-white/10 bg-[#12141C]">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              CLIENTE / EMPRESA
            </label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="inset-input w-full pl-10 pr-4 py-3 rounded-xl bg-[#1E2129] text-sm font-semibold text-white focus:outline-none appearance-none cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.name} className="bg-[#12141C]">
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowNewClientModal(true)}
              className="mt-2 text-indigo-400 text-xs font-bold flex items-center gap-1.5 hover:underline"
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar novo cliente
            </button>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              CLASSIFICAÇÃO
            </label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as JobClassification)}
              className="inset-input w-full px-4 py-3 rounded-xl bg-[#1E2129] text-sm font-semibold text-white focus:outline-none appearance-none cursor-pointer"
            >
              <option value="normal" className="bg-[#12141C]">Normal (Seg-Sex)</option>
              <option value="saturday" className="bg-[#12141C]">Sábado</option>
              <option value="sunday" className="bg-[#12141C]">Domingo</option>
              <option value="holiday" className="bg-[#12141C]">Feriado</option>
              <option value="no_work" className="bg-[#12141C]">Sem Trabalho / Standby</option>
            </select>
          </div>
        </div>

        {/* Section: Data & Hora */}
        <div className="tactile-card rounded-2xl p-5 flex flex-col gap-4 border border-white/10 bg-[#12141C]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                DATA DE ENTRADA
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                HORA DE ENTRADA
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                DATA DE SAÍDA
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                HORA DE SAÍDA
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section: Veículo & KM */}
        <div className="tactile-card rounded-2xl p-5 flex flex-col gap-4 border border-white/10 bg-[#12141C]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  KM INICIAL
                </label>
                {kmInitial !== '' && (
                  <span
                    className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
                    title="Preenchido automaticamente com o KM final do card anterior"
                  >
                    KM Final Card Anterior
                  </span>
                )}
              </div>
              <input
                type="number"
                placeholder="0"
                value={kmInitial}
                onChange={(e) => {
                  setIsKmInitialManual(true);
                  setKmInitial(e.target.value === '' ? '' : Number(e.target.value));
                }}
                className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-semibold text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                KM FINAL
              </label>
              <input
                type="number"
                placeholder="0"
                value={kmFinal}
                onChange={(e) => setKmFinal(e.target.value === '' ? '' : Number(e.target.value))}
                className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-semibold text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-indigo-500/10 rounded-xl p-3 flex justify-between items-center border border-indigo-500/20">
            <span className="text-xs font-bold text-indigo-400">Total Percorrido</span>
            <span className="text-base font-extrabold text-indigo-400">
              {calculatedKmTotal} KM
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              TIPO / MODELO DO VEÍCULO
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="inset-input w-full px-4 py-3 rounded-xl bg-[#1E2129] text-sm font-semibold text-white focus:outline-none cursor-pointer"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={`${v.model} (${v.plate})`} className="bg-[#12141C]">
                  {v.model} ({v.plate})
                </option>
              ))}
              <option value="Mercedes Benz Sprinter (ABC-1234)" className="bg-[#12141C]">Mercedes Benz Sprinter (ABC-1234)</option>
              <option value="Volvo FH 540 (XYZ-9876)" className="bg-[#12141C]">Volvo FH 540 (XYZ-9876)</option>
              <option value="Volkswagen Delivery (KML-5521)" className="bg-[#12141C]">Volkswagen Delivery (KML-5521)</option>
              <option value="Fiat Ducato (QWE-1020)" className="bg-[#12141C]">Fiat Ducato (QWE-1020)</option>
            </select>
          </div>
        </div>

        {/* Section: Service Details */}
        <div className="tactile-card rounded-2xl p-5 flex flex-col gap-4 border border-white/10 bg-[#12141C]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                PESSOAS
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                  className="w-9 h-9 rounded-full bg-[#1E2129] flex items-center justify-center text-slate-200 font-bold active:scale-90 transition-all hover:bg-slate-700"
                >
                  -
                </button>
                <input
                  type="number"
                  readOnly
                  value={peopleCount}
                  className="inset-input w-full text-center py-2 rounded-xl bg-[#1E2129] text-sm font-bold text-white"
                />
                <button
                  type="button"
                  onClick={() => setPeopleCount(peopleCount + 1)}
                  className="w-9 h-9 rounded-full bg-[#1E2129] flex items-center justify-center text-slate-200 font-bold active:scale-90 transition-all hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                TIPO DE SERVIÇO
              </label>
              <div className="flex bg-[#1E2129] rounded-full p-1 border border-white/5">
                <button
                  type="button"
                  onClick={() => setServiceType('PESSOAL')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-full transition-all uppercase ${
                    serviceType === 'PESSOAL'
                      ? 'bg-indigo-600 shadow-xs text-white'
                      : 'text-slate-400'
                  }`}
                >
                  PESSOAL
                </button>
                <button
                  type="button"
                  onClick={() => setServiceType('CARGA')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-full transition-all uppercase ${
                    serviceType === 'CARGA'
                      ? 'bg-indigo-600 shadow-xs text-white'
                      : 'text-slate-400'
                  }`}
                >
                  CARGA
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              VALOR DO SERVIÇO (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                R$
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="inset-input w-full pl-12 pr-10 py-3 rounded-xl bg-[#1E2129] text-sm font-bold text-indigo-400 focus:outline-none"
              />
              <Edit2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <p className="mt-1 text-[10px] text-slate-400 text-right">
              Valor padrão sugerido pelo sistema
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              OBSERVAÇÕES
            </label>
            <textarea
              rows={3}
              placeholder="Detalhes adicionais do trajeto ou serviço..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="inset-input w-full px-4 py-3 rounded-xl bg-[#1E2129] text-xs font-medium text-white focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 pb-6">
          <button
            type="submit"
            disabled={isSubmitting || isSuccess}
            className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-[0.98] ${
              isSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30 border border-indigo-400/30'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : isSuccess ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                Trabalho Salvo!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                Salvar Trabalho
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Modal Quick Add Client */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-white">
            <h3 className="text-lg font-bold text-white">Adicionar Novo Cliente</h3>
            <form onSubmit={handleAddQuickClient} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: TransLog Brasil Ltda"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-semibold focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Tipo de Pessoa</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewClientType('PJ')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      newClientType === 'PJ'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#1E2129] text-slate-400'
                    }`}
                  >
                    Pessoa Jurídica (PJ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewClientType('PF')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      newClientType === 'PF'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#1E2129] text-slate-400'
                    }`}
                  >
                    Pessoa Física (PF)
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#1E2129] text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
