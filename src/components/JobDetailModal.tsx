import React, { useState, useEffect } from 'react';
import { useFleet } from '../context/FleetContext';
import { Job, JobClassification, JobStatus, ServiceCategory } from '../types';
import { getClassificationBadge, formatDateBR, calculateWorkedHours } from './JobCard';
import {
  X,
  Building2,
  Calendar,
  Clock,
  Gauge,
  Truck,
  Users,
  Package,
  UserCheck,
  CheckCircle2,
  Trash2,
  FileText,
  DollarSign,
  Edit2,
  Save,
} from 'lucide-react';

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose }) => {
  const { clients, vehicles, driverProfile, updateJob, deleteJob } = useFleet();
  const [currentStatus, setCurrentStatus] = useState<JobStatus>(job.status);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form states for editing
  const [clientName, setClientName] = useState(job.clientName || '');
  const [classification, setClassification] = useState<JobClassification>(job.classification || 'normal');
  const [startDate, setStartDate] = useState(job.startDate || '');
  const [startTime, setStartTime] = useState(job.startTime || '');
  const [endDate, setEndDate] = useState(job.endDate || '');
  const [endTime, setEndTime] = useState(job.endTime || '');
  const [kmInitial, setKmInitial] = useState<number | ''>(job.kmInitial);
  const [kmFinal, setKmFinal] = useState<number | ''>(job.kmFinal);
  const [peopleCount, setPeopleCount] = useState<number>(job.peopleCount || 1);
  const [serviceType, setServiceType] = useState<ServiceCategory>(job.serviceType || 'CARGA');
  const [amount, setAmount] = useState<string>(job.amount.toString());
  const [notes, setNotes] = useState(job.notes || '');

  useEffect(() => {
    setCurrentStatus(job.status);
    setClientName(job.clientName || '');
    setClassification(job.classification || 'normal');
    setStartDate(job.startDate || '');
    setStartTime(job.startTime || '');
    setEndDate(job.endDate || '');
    setEndTime(job.endTime || '');
    setKmInitial(job.kmInitial);
    setKmFinal(job.kmFinal);
    setPeopleCount(job.peopleCount || 1);
    setServiceType(job.serviceType || 'CARGA');
    setAmount(job.amount.toString());
    setNotes(job.notes || '');
  }, [job]);

  const calculatedKmTotal =
    typeof kmInitial === 'number' && typeof kmFinal === 'number' && kmFinal >= kmInitial
      ? kmFinal - kmInitial
      : 0;

  const workedHours = calculateWorkedHours(startDate, startTime, endDate, endTime);

  const handleStatusChange = (newStatus: JobStatus) => {
    setCurrentStatus(newStatus);
    updateJob(job.id, { status: newStatus });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
    const initialKmNum = typeof kmInitial === 'number' ? kmInitial : 0;
    const finalKmNum = typeof kmFinal === 'number' ? kmFinal : initialKmNum + calculatedKmTotal;

    updateJob(job.id, {
      title: `Serviço - ${clientName || job.clientName}`,
      clientName,
      classification,
      startDate,
      startTime,
      endDate,
      endTime,
      kmInitial: initialKmNum,
      kmFinal: finalKmNum,
      kmTotal: calculatedKmTotal,
      peopleCount,
      serviceType,
      amount: parsedAmount,
      status: currentStatus,
      notes,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsEditing(false);
    }, 800);
  };

  const handleDelete = () => {
    deleteJob(job.id);
    onClose();
  };

  const isPersonal = serviceType === 'PESSOAL';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-5 text-white">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {job.code}
              </span>
              {getClassificationBadge(classification)}
            </div>
            <h3 className="text-lg font-bold text-white leading-snug">
              {isEditing ? 'Editar Serviço' : job.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEditing ? (
          <>
            {/* Status selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">
                Status do Serviço
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Finalizado', 'Em Trânsito', 'Pendente'] as JobStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentStatus === st
                        ? st === 'Finalizado'
                          ? 'bg-emerald-600 text-white'
                          : st === 'Em Trânsito'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700 text-white'
                        : 'bg-[#1E2129] text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* View Details Grid */}
            <div className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#1E2129] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Empresa
                  </span>
                  <span className="font-bold text-white truncate">{clientName || 'N/A'}</span>
                </div>

                <div className="bg-[#1E2129] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-indigo-400" /> Veículo
                  </span>
                  <span className="font-bold text-white truncate">{job.vehicleModel || 'N/A'}</span>
                </div>

                <div className="bg-[#1E2129] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Data Entrada / Saída
                  </span>
                  <span className="font-bold text-slate-200">
                    {formatDateBR(startDate)} — {formatDateBR(endDate)}
                  </span>
                </div>

                <div className="bg-[#1E2129] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Hora Entrada / Saída
                  </span>
                  <span className="font-bold text-slate-200">
                    {startTime || '--:--'} — {endTime || '--:--'}
                    {workedHours && (
                      <span className="text-indigo-400 font-bold ml-1.5">({workedHours})</span>
                    )}
                  </span>
                </div>

                <div className="bg-[#1E2129] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-indigo-400" /> KM Início → Fim
                  </span>
                  <span className="font-bold text-slate-200">
                    {kmInitial} → {kmFinal} ({calculatedKmTotal} km)
                  </span>
                </div>

                <div className="bg-[#1E2129] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    {isPersonal ? (
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    Tipo & Pessoas
                  </span>
                  <span className="font-bold text-slate-200">
                    {isPersonal ? 'Pessoas' : 'Frete'} ({peopleCount}{' '}
                    {peopleCount === 1 ? 'pessoa' : 'pessoas'})
                  </span>
                </div>
              </div>

              <div className="bg-[#1E2129] p-3.5 rounded-xl border border-white/5 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Valor Pago do Trabalho:</span>
                <span className="font-extrabold text-indigo-400 text-base">
                  {driverProfile.privacyHideFinancials
                    ? 'R$ •••'
                    : `R$ ${parseFloat(amount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>

              {notes && (
                <div className="bg-[#1E2129] p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Observações
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed italic">{notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all flex-1"
              >
                <Edit2 className="w-4 h-4" /> Editar Serviço / Data e Hora
              </button>

              {!isDeleting ? (
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="py-3 px-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Excluir Serviço"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="py-3 px-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              )}
            </div>
          </>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
            {/* Data e Hora Section */}
            <div className="bg-[#1E2129] p-3.5 rounded-2xl border border-white/10 flex flex-col gap-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Datas e Horários de Entrada / Saída
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                    Data Entrada
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                    Hora Entrada
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                    Data Saída
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-indigo-400 uppercase mb-1 block">
                    Hora Saída
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold text-white focus:outline-none border border-indigo-500/40"
                  />
                </div>
              </div>
            </div>

            {/* KM & Value */}
            <div className="bg-[#1E2129] p-3.5 rounded-2xl border border-white/10 flex flex-col gap-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4" /> Hodômetro & Valor
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                    KM Inicial
                  </label>
                  <input
                    type="number"
                    value={kmInitial}
                    onChange={(e) =>
                      setKmInitial(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                    KM Final
                  </label>
                  <input
                    type="number"
                    value={kmFinal}
                    onChange={(e) =>
                      setKmFinal(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Valor do Serviço (R$)
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-bold text-indigo-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Client & Classification */}
            <div className="bg-[#1E2129] p-3.5 rounded-2xl border border-white/10 flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Cliente / Empresa
                </label>
                <select
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.name} className="bg-[#12141C]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Classificação
                </label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value as JobClassification)}
                  className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value="normal" className="bg-[#12141C]">Normal (Seg-Sex)</option>
                  <option value="saturday" className="bg-[#12141C]">Sábado</option>
                  <option value="sunday" className="bg-[#12141C]">Domingo</option>
                  <option value="holiday" className="bg-[#12141C]">Feriado</option>
                  <option value="no_work" className="bg-[#12141C]">Sem Trabalho / Standby</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-medium text-white focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Edit Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 bg-[#1E2129] hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Salvo!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

