import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Job, JobClassification, JobStatus } from '../types';
import {
  Calendar,
  Clock,
  Gauge,
  Truck,
  Building2,
  Users,
  Package,
  UserCheck,
  FileText,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JobCardProps {
  job: Job;
  privacyHideFinancials?: boolean;
  onClick?: () => void;
  onOpenDetails?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  defaultExpanded?: boolean;
}

export const getClassificationBadge = (classification?: JobClassification) => {
  switch (classification) {
    case 'saturday':
      return (
        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-md uppercase tracking-wider">
          Sábado
        </span>
      );
    case 'sunday':
      return (
        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold rounded-md uppercase tracking-wider">
          Domingo
        </span>
      );
    case 'holiday':
      return (
        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded-md uppercase tracking-wider">
          Feriado
        </span>
      );
    case 'no_work':
      return (
        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 border border-slate-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
          Sem Trabalho / Standby
        </span>
      );
    case 'normal':
    default:
      return (
        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold rounded-md uppercase tracking-wider">
          Dia Normal (Seg-Sex)
        </span>
      );
  }
};

export const getStatusBadge = (status: JobStatus) => {
  switch (status) {
    case 'Finalizado':
      return (
        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase">
          Finalizado
        </span>
      );
    case 'Em Trânsito':
      return (
        <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase">
          Em Trânsito
        </span>
      );
    case 'Pendente':
    case 'Agendado':
    default:
      return (
        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold rounded-full uppercase">
          Pendente
        </span>
      );
  }
};

export const formatDateBR = (dateStr?: string) => {
  if (!dateStr) return '--/--/----';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const calculateWorkedHours = (
  startDate?: string,
  startTime?: string,
  endDate?: string,
  endTime?: string
) => {
  if (!startTime || !endTime) return null;

  try {
    const sDate = startDate || '1970-01-01';
    const eDate = endDate || sDate;

    const start = new Date(`${sDate}T${startTime}:00`);
    const end = new Date(`${eDate}T${endTime}:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;

      let startMins = sh * 60 + sm;
      let endMins = eh * 60 + em;
      if (endMins < startMins) endMins += 24 * 60;
      const totalMins = endMins - startMins;
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      if (h === 0 && m === 0) return '0h';
      if (m === 0) return `${h}h`;
      if (h === 0) return `${m}min`;
      return `${h}h ${m}min`;
    }

    let diffMs = end.getTime() - start.getTime();

    if (diffMs < 0 && sDate === eDate) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    if (diffMs < 0) return null;

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours === 0 && mins === 0) return '0h';
    if (mins === 0) return `${hours}h`;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  } catch {
    return null;
  }
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  privacyHideFinancials,
  onClick,
  onOpenDetails,
  isExpanded,
  onToggleExpand,
  defaultExpanded = false,
}) => {
  const { vehicles } = useFleet();
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);

  const isControlled = isExpanded !== undefined;
  const effectiveExpanded = isControlled ? isExpanded : localExpanded;

  const handleToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setLocalExpanded((prev) => !prev);
    }
  };

  const handleOpenDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenDetails) {
      onOpenDetails();
    } else if (onClick) {
      onClick();
    }
  };

  const isPersonal = job.serviceType === 'PESSOAL';

  const matchedVehicle = vehicles.find((v) => {
    if (job.vehiclePlate && v.plate) {
      return v.plate.toLowerCase() === job.vehiclePlate.toLowerCase();
    }
    if (job.vehicleModel && v.model) {
      return (
        job.vehicleModel.toLowerCase().includes(v.model.toLowerCase()) ||
        v.model.toLowerCase().includes(job.vehicleModel.toLowerCase())
      );
    }
    return false;
  }) || vehicles[0];

  const vehicleImg = matchedVehicle?.image;
  const vehicleText = job.vehicleModel || matchedVehicle?.model || 'Veículo';
  const plate = job.vehiclePlate || matchedVehicle?.plate;
  const hasPlateInText = Boolean(
    vehicleText.includes('(') || (plate && vehicleText.toLowerCase().includes(plate.toLowerCase()))
  );
  const workedHours = calculateWorkedHours(job.startDate, job.startTime, job.endDate, job.endTime);

  // Verificação de campos pendentes / incompletos
  const isKmMissing = !job.kmTotal || job.kmTotal <= 0 || !job.kmFinal || job.kmFinal <= job.kmInitial;
  const isEndTimeMissing = !job.endTime || job.endTime.trim() === '' || job.endTime === '--:--';
  const isEndDateMissing = !job.endDate || job.endDate.trim() === '';
  const isAmountMissing = !job.amount || job.amount <= 0;
  const isClientMissing =
    !job.clientName ||
    job.clientName.trim() === '' ||
    job.clientName.toLowerCase() === 'não especificada' ||
    job.clientName.toLowerCase() === 'não informada';
  const isStatusIncomplete = job.status !== 'Finalizado';

  const hasMissingFields =
    isKmMissing || isEndTimeMissing || isEndDateMissing || isAmountMissing || isClientMissing || isStatusIncomplete;

  return (
    <div
      className={`card-3d rounded-2xl transition-all duration-200 bg-[#12141C] border overflow-hidden relative ${
        effectiveExpanded
          ? 'border-indigo-500/50 shadow-[0_8px_25px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/20'
          : hasMissingFields
          ? 'border-amber-500/60 shadow-[0_0_18px_rgba(245,158,11,0.18)] ring-1 ring-amber-500/40 hover:border-amber-400/80 hover:bg-[#151824]'
          : 'border-white/10 hover:border-white/20 hover:bg-[#151824]'
      }`}
    >
      {/* Miniature Header: Always visible */}
      <div
        onClick={handleToggle}
        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none group"
      >
        {/* Left: Thumbnail & Essential Info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Vehicle Photo / Icon */}
          <div className="relative shrink-0 mt-0.5">
            {vehicleImg ? (
              <img
                src={vehicleImg}
                alt={matchedVehicle?.model || 'Veículo'}
                className="w-11 h-11 rounded-xl object-cover border border-white/15 shadow-sm group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Truck className="w-5 h-5" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 p-0.5 rounded-full border border-[#12141C] text-white">
              <Truck className="w-2.5 h-2.5" />
            </div>
          </div>

          {/* Core Info */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-slate-400 leading-none">
                {job.code}
              </span>
              {hasMissingFields && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-2.5 h-2.5 text-red-400" />
                  Pendente
                </span>
              )}
            </div>

            <div className="flex items-center">
              {getClassificationBadge(job.classification)}
            </div>

            <div className="flex items-center">
              {getStatusBadge(job.status)}
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight truncate group-hover:text-indigo-300 transition-colors mt-0.5">
              {job.title}
            </h4>

            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 truncate">
              {isClientMissing ? (
                <span className="text-red-400 font-bold bg-red-500/15 border border-red-500/40 px-1.5 py-0.5 rounded animate-pulse">
                  Falta Cliente
                </span>
              ) : (
                <span className="text-indigo-300 font-semibold truncate">
                  {job.clientName || 'Cliente Particular'}
                </span>
              )}
              <span className="opacity-40">•</span>
              <span className="font-mono text-slate-300 font-medium">
                {plate || vehicleText}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Value, Expand Button & KM Rodados */}
        <div className="flex flex-col items-end justify-between shrink-0 self-stretch">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs sm:text-sm font-extrabold leading-none py-0.5 ${
                isAmountMissing
                  ? 'text-red-400 bg-red-500/15 border border-red-500/40 px-1.5 py-0.5 rounded-md animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                  : 'text-indigo-400'
              }`}
            >
              {privacyHideFinancials
                ? 'R$ •••'
                : isAmountMissing
                ? 'R$ 0,00 (Pendente)'
                : job.amount > 0
                ? `R$ ${job.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'R$ 0,00'}
            </span>

            <button
              type="button"
              onClick={handleToggle}
              aria-label={effectiveExpanded ? 'Recolher informações' : 'Expandir informações'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                effectiveExpanded
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-xs'
                  : 'bg-white/5 text-slate-400 border-white/10 group-hover:border-white/20 group-hover:text-white'
              }`}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  effectiveExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex flex-col items-end leading-none mt-auto pt-2">
            <span
              className={`text-[9px] font-semibold uppercase tracking-wider ${
                isKmMissing ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400'
              }`}
            >
              KM Rodados
            </span>
            <span
              className={`text-[11px] font-mono font-bold mt-1 ${
                isKmMissing
                  ? 'text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/40 animate-pulse font-extrabold shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                  : 'text-slate-200'
              }`}
            >
              {isKmMissing ? '0 km (Pendente)' : `${job.kmTotal} km`}
            </span>
          </div>
        </div>
      </div>

      {/* Miniature Quick Bar (Visible only when collapsed) */}
      {!effectiveExpanded && (
        <div
          onClick={handleToggle}
          className="px-3.5 pb-3 pt-1 flex items-center justify-between gap-2 text-[10.5px] text-slate-400 border-t border-white/5 cursor-pointer bg-white/[0.01]"
        >
          <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="flex items-center gap-1 font-mono text-slate-300">
              <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
              {formatDateBR(job.startDate)}
            </span>
            <span
              className={`flex items-center gap-1 font-mono ${
                isEndTimeMissing
                  ? 'text-red-400 font-bold bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/40 animate-pulse'
                  : 'text-slate-300'
              }`}
            >
              <Clock
                className={`w-3 h-3 shrink-0 ${isEndTimeMissing ? 'text-red-400' : 'text-indigo-400'}`}
              />
              {job.startTime || '--:--'}
              {isEndTimeMissing ? ' → Falta término' : ` → ${job.endTime}`}
              {workedHours ? ` (${workedHours})` : ''}
            </span>
            <span
              className={`hidden sm:flex items-center gap-1 font-mono ${
                isKmMissing
                  ? 'text-red-400 font-bold bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/40 animate-pulse'
                  : 'text-slate-300'
              }`}
            >
              <Gauge
                className={`w-3 h-3 shrink-0 ${isKmMissing ? 'text-red-400' : 'text-indigo-400'}`}
              />
              {job.kmInitial} → {isKmMissing ? 'Falta KM final' : job.kmFinal}
            </span>
          </div>

          <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 shrink-0 hover:underline">
            Ver detalhes
            <ChevronDown className="w-3 h-3" />
          </span>
        </div>
      )}

      {/* Expanded Full Details Section */}
      <AnimatePresence initial={false}>
        {effectiveExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/10 bg-[#0E1017]/80"
          >
            <div className="p-4 flex flex-col gap-3">
              {/* Aviso de Dados Faltantes */}
              {hasMissingFields && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-bold">
                      Faltam informações para completar este serviço!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenDetails}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[11px] shrink-0 active:scale-95 transition-all"
                  >
                    Completar
                  </button>
                </div>
              )}

              {/* Detailed Grid: All Information Contained */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* 1. Empresa Cadastrada */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                    isClientMissing
                      ? 'bg-red-500/10 border-red-500/40 animate-pulse'
                      : 'bg-[#181B24] border-white/5'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isClientMissing
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider block ${
                        isClientMissing ? 'text-red-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Empresa Cadastrada {isClientMissing && '• Pendente'}
                    </span>
                    <span
                      className={`font-bold truncate block ${
                        isClientMissing ? 'text-red-300' : 'text-white'
                      }`}
                    >
                      {isClientMissing ? 'Cliente não informado' : job.clientName}
                    </span>
                  </div>
                </div>

                {/* 2. Tipo / Modelo do Veículo com Foto */}
                <div className="bg-[#181B24] p-2.5 rounded-xl border border-white/5 flex items-center gap-2.5">
                  {vehicleImg ? (
                    <img
                      src={vehicleImg}
                      alt={job.vehicleModel}
                      className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Veículo & Placa
                    </span>
                    <span className="font-bold text-white truncate block">
                      {job.vehicleModel || 'Não especificado'}
                    </span>
                  </div>
                </div>

                {/* 3. Data Entrada - Data Saída */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                    isEndDateMissing
                      ? 'bg-red-500/10 border-red-500/40 animate-pulse'
                      : 'bg-[#181B24] border-white/5'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isEndDateMissing
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider block ${
                        isEndDateMissing ? 'text-red-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Data Entrada / Saída {isEndDateMissing && '• Pendente'}
                    </span>
                    <span
                      className={`font-semibold block font-mono ${
                        isEndDateMissing ? 'text-red-300' : 'text-slate-200'
                      }`}
                    >
                      {formatDateBR(job.startDate)} —{' '}
                      {isEndDateMissing ? 'Falta data final' : formatDateBR(job.endDate)}
                    </span>
                  </div>
                </div>

                {/* 4. Hora Entrada - Hora Saída */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                    isEndTimeMissing
                      ? 'bg-red-500/10 border-red-500/40 animate-pulse'
                      : 'bg-[#181B24] border-white/5'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isEndTimeMissing
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider block ${
                        isEndTimeMissing ? 'text-red-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Horário & Tempo Trabalhado {isEndTimeMissing && '• Pendente'}
                    </span>
                    <span
                      className={`font-semibold block font-mono ${
                        isEndTimeMissing ? 'text-red-300' : 'text-slate-200'
                      }`}
                    >
                      {job.startTime || '--:--'} —{' '}
                      {isEndTimeMissing ? 'Falta hora término' : job.endTime || '--:--'}
                      {workedHours && (
                        <span className="text-indigo-400 font-bold ml-1.5 font-sans">
                          ({workedHours})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* 5. KM Início - KM Final (e Total) */}
                <div
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                    isKmMissing
                      ? 'bg-red-500/10 border-red-500/40 animate-pulse'
                      : 'bg-[#181B24] border-white/5'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isKmMissing
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider block ${
                        isKmMissing ? 'text-red-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Hodômetro (KM Início → Fim) {isKmMissing && '• Pendente'}
                    </span>
                    <span
                      className={`font-semibold block font-mono ${
                        isKmMissing ? 'text-red-300' : 'text-slate-200'
                      }`}
                    >
                      {job.kmInitial.toLocaleString('pt-BR')} →{' '}
                      {isKmMissing ? 'Falta KM final' : job.kmFinal.toLocaleString('pt-BR')}{' '}
                      <span
                        className={`font-bold font-sans ml-1 ${
                          isKmMissing ? 'text-red-400' : 'text-indigo-400'
                        }`}
                      >
                        ({job.kmTotal > 0 ? `${job.kmTotal} km rodados` : '0 km rodados'})
                      </span>
                    </span>
                  </div>
                </div>

                {/* 6 & 7. Tipo do Serviço & Qtd de Pessoas */}
                <div className="bg-[#181B24] p-2.5 rounded-xl border border-white/5 flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    {isPersonal ? (
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Package className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tipo de Serviço & Pessoas
                    </span>
                    <span className="font-semibold text-slate-200 block">
                      {isPersonal ? 'Transporte de Pessoas' : 'Frete de Carga'} •{' '}
                      <span className="text-white font-bold">
                        {job.peopleCount} {job.peopleCount === 1 ? 'Pessoa' : 'Pessoas'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 8. Observações */}
              {job.notes && (
                <div className="bg-[#181B24] p-2.5 rounded-xl border border-white/5 flex items-start gap-2 text-xs">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Observações Registradas
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed italic mt-0.5">
                      "{job.notes}"
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons inside Expanded Card */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 mt-1">
                <button
                  type="button"
                  onClick={handleOpenDetails}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border border-indigo-400/30"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar / Detalhes Completos</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggle}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all border border-white/5"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Recolher</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
