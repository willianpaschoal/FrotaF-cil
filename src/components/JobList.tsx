import React, { useState, useMemo } from 'react';
import { useFleet } from '../context/FleetContext';
import { Job } from '../types';
import { JobCard } from './JobCard';
import {
  Search,
  Plus,
  Truck,
  Calendar,
  Archive,
  ChevronDown,
  ChevronUp,
  Gauge,
  DollarSign,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  CalendarCheck2,
  FolderArchive,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JobListProps {
  onSelectJob: (job: Job) => void;
}

const formatMonthYearBR = (yearMonth: string) => {
  try {
    const [year, month] = yearMonth.split('-').map(Number);
    if (!year || !month) return yearMonth;
    const date = new Date(year, month - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${capitalized} de ${year}`;
  } catch {
    return yearMonth;
  }
};

export const JobList: React.FC<JobListProps> = ({ onSelectJob }) => {
  const { jobs, driverProfile, setActiveTab } = useFleet();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Track which individual job cards are expanded (if user clicks toggle)
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({});

  // Track which past month cards are open (revealing their jobs)
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  // Filter jobs by search term & status
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.clientName && j.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (j.vehiclePlate && j.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (j.code && j.code.toLowerCase().includes(searchTerm.toLowerCase()));

      if (statusFilter === 'Todos') return matchesSearch;
      return matchesSearch && j.status === statusFilter;
    });
  }, [jobs, searchTerm, statusFilter]);

  // Current year-month key (e.g. '2026-09')
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  // Separate jobs into Current Month vs Past Ended Months
  const { currentMonthJobs, pastMonthsList } = useMemo(() => {
    const current: Job[] = [];
    const pastMap: Record<string, Job[]> = {};

    filteredJobs.forEach((job) => {
      const dateStr = job.startDate || job.createdAt || '';
      const jobMonthKey = dateStr.substring(0, 7) || currentYearMonth;

      if (jobMonthKey >= currentYearMonth) {
        current.push(job);
      } else {
        if (!pastMap[jobMonthKey]) {
          pastMap[jobMonthKey] = [];
        }
        pastMap[jobMonthKey].push(job);
      }
    });

    // Sort past months in descending order (most recent past month first)
    const sortedPastKeys = Object.keys(pastMap).sort((a, b) => b.localeCompare(a));
    const pastMonths = sortedPastKeys.map((monthKey) => {
      const monthJobs = pastMap[monthKey];
      const totalAmount = monthJobs.reduce((acc, j) => acc + (j.amount || 0), 0);
      const totalKm = monthJobs.reduce((acc, j) => acc + (j.kmTotal || 0), 0);
      const completedCount = monthJobs.filter((j) => j.status === 'Finalizado').length;

      return {
        monthKey,
        monthLabel: formatMonthYearBR(monthKey),
        jobs: monthJobs,
        totalAmount,
        totalKm,
        completedCount,
      };
    });

    return {
      currentMonthJobs: current,
      pastMonthsList: pastMonths,
    };
  }, [filteredJobs, currentYearMonth]);

  // Toggle single job card expansion
  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  // Toggle single past-month card expansion
  const toggleMonthExpansion = (monthKey: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  // Summary counts for current month
  const currentMonthStats = useMemo(() => {
    const totalAmount = currentMonthJobs.reduce((acc, j) => acc + (j.amount || 0), 0);
    const totalKm = currentMonthJobs.reduce((acc, j) => acc + (j.kmTotal || 0), 0);
    return { totalAmount, totalKm };
  }, [currentMonthJobs]);

  return (
    <div className="pt-18 pb-28 px-4 sm:px-5 max-w-lg mx-auto flex flex-col gap-5">
      {/* Title & Action */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Trabalhos</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie e acompanhe todos os serviços da frota.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('job_form')}
          className="bg-indigo-600 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-md hover:bg-indigo-500 active:scale-95 transition-all border border-indigo-400/30 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Novo Trabalho</span>
        </button>
      </div>

      {/* Search & Status Filter Tabs */}
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, título, placa ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="inset-input w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none placeholder:text-slate-500 text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-0.5 flex-1">
            {['Todos', 'Finalizado', 'Em Trânsito', 'Pendente'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-[#1E2129] text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredJobs.length === 0 ? (
        <div className="card-3d rounded-2xl p-8 text-center text-slate-500 flex flex-col items-center gap-2.5 bg-[#12141C] border border-white/10">
          <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400">
            <Truck className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Nenhum trabalho encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Tente alterar os termos da busca ou registre um novo serviço.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* SECTION 1: MÊS ATUAL (Current Month) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span>Mês Atual</span>
                  <span className="text-white font-semibold">
                    ({formatMonthYearBR(currentYearMonth)})
                  </span>
                </h3>
              </div>

              {currentMonthJobs.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>{currentMonthJobs.length} {currentMonthJobs.length === 1 ? 'trabalho' : 'trabalhos'}</span>
                  <span>•</span>
                  <span className="text-indigo-400 font-bold">
                    {driverProfile.privacyHideFinancials
                      ? 'R$ •••'
                      : `R$ ${currentMonthStats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              )}
            </div>

            {/* Current Month Jobs List */}
            {currentMonthJobs.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#141620] border border-white/5 text-center text-slate-400 text-xs">
                Nenhum trabalho cadastrado para este mês atual.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {currentMonthJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    privacyHideFinancials={driverProfile.privacyHideFinancials}
                    isExpanded={expandedJobIds[job.id] ?? false}
                    onToggleExpand={() => toggleJobExpansion(job.id)}
                    onOpenDetails={() => onSelectJob(job)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: MESES ANTERIORES ENCERRADOS (Past Months Single Cards) */}
          {pastMonthsList.length > 0 && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between px-1 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <Archive className="w-3.5 h-3.5 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Meses Anteriores Concluídos
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {pastMonthsList.length} {pastMonthsList.length === 1 ? 'mês arquivado' : 'meses arquivados'}
                </span>
              </div>

              {/* Each finished month rendered as SOMENTE UM CARD (single card) with distinct highlighted styling and glowing effect */}
              <div className="flex flex-col gap-3">
                {pastMonthsList.map((month) => {
                  const isMonthExpanded = expandedMonths[month.monthKey] ?? false;

                  return (
                    <div
                      key={month.monthKey}
                      className={`relative card-3d rounded-2xl transition-all duration-300 overflow-hidden border ${
                        isMonthExpanded
                          ? 'bg-gradient-to-br from-[#1C1828] via-[#141525] to-[#1F172C] border-amber-400/70 ring-2 ring-amber-400/25 shadow-[0_12px_40px_rgba(245,158,11,0.22)]'
                          : 'bg-gradient-to-br from-[#171827] via-[#131422] to-[#1A1626] border-amber-500/40 hover:border-amber-400/75 shadow-[0_4px_24px_rgba(245,158,11,0.1)] hover:shadow-[0_8px_36px_rgba(245,158,11,0.2)] hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Top radiant neon accent beam */}
                      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />

                      {/* Ambient background light glows */}
                      <div className="pointer-events-none absolute -right-8 -top-8 w-36 h-36 bg-amber-500/12 rounded-full blur-2xl" />
                      <div className="pointer-events-none absolute -left-8 -bottom-8 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl" />

                      {/* The Single Month Card Header - Clickable to reveal all jobs */}
                      <div
                        onClick={() => toggleMonthExpansion(month.monthKey)}
                        className="p-4 cursor-pointer select-none group relative z-10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Month Icon + Title & Badge */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-600/10 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-105 group-hover:border-amber-300 transition-all shrink-0">
                              <CalendarCheck2 className="w-5 h-5" />
                            </div>

                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm sm:text-base font-black text-white leading-tight truncate group-hover:text-amber-200 transition-colors">
                                  {month.monthLabel}
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
                                  Mês Fechado
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-300/90 flex items-center gap-1.5 mt-0.5">
                                <span className="font-semibold text-amber-200/90">
                                  {month.jobs.length} {month.jobs.length === 1 ? 'trabalho' : 'trabalhos'}
                                </span>
                                <span>•</span>
                                <span className="text-slate-300 font-mono">
                                  {month.totalKm.toLocaleString('pt-BR')} km rodados
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Right: Total Month Revenue + Expand Chevron */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="text-right">
                              <span className="text-xs sm:text-base font-black text-amber-400 block tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.35)]">
                                {driverProfile.privacyHideFinancials
                                  ? 'R$ •••'
                                  : `R$ ${month.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {month.completedCount} finalizados
                              </span>
                            </div>

                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                                isMonthExpanded
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 group-hover:bg-amber-500/25 group-hover:border-amber-400/60'
                              }`}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isMonthExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Interactive Prompt Banner on the Card with Gold Accent */}
                        <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between text-[11px] bg-amber-500/[0.04] -mx-4 -mb-4 px-4 py-2">
                          <span className="text-amber-200/80 flex items-center gap-1.5 font-medium">
                            {isMonthExpanded ? (
                              <>
                                <Layers className="w-3.5 h-3.5 text-amber-400" />
                                <span>Exibindo histórico de {month.monthLabel}</span>
                              </>
                            ) : (
                              <>
                                <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                                <span>Toque para visualizar os trabalhos consolidados deste mês</span>
                              </>
                            )}
                          </span>

                          <span className="text-[10.5px] font-bold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 shrink-0">
                            {isMonthExpanded ? 'Recolher mês' : 'Abrir mês'}
                            <ChevronDown
                              className={`w-3 h-3 transition-transform ${
                                isMonthExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </span>
                        </div>
                      </div>

                      {/* When this month card is clicked, smoothly reveal all jobs of that month */}
                      <AnimatePresence initial={false}>
                        {isMonthExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="border-t border-amber-500/25 bg-[#0B0C14]/95 p-3.5 flex flex-col gap-2.5 relative z-10"
                          >
                            <div className="flex items-center justify-between px-1 pb-1">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
                                <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                                Lista de Trabalhos • {month.monthLabel}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono font-bold border border-amber-500/25">
                                Total: {month.jobs.length} {month.jobs.length === 1 ? 'registro' : 'registros'}
                              </span>
                            </div>

                            {/* All jobs from that past month in miniature/expandable format */}
                            <div className="flex flex-col gap-2">
                              {month.jobs.map((job) => (
                                <JobCard
                                  key={job.id}
                                  job={job}
                                  privacyHideFinancials={driverProfile.privacyHideFinancials}
                                  isExpanded={expandedJobIds[job.id] ?? false}
                                  onToggleExpand={() => toggleJobExpansion(job.id)}
                                  onOpenDetails={() => onSelectJob(job)}
                                />
                              ))}
                            </div>

                            {/* Collapse Month button at bottom of list */}
                            <div className="pt-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleMonthExpansion(month.monthKey)}
                                className="px-4 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 border border-amber-500/30 transition-all shadow-xs active:scale-95"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                                <span>Recolher {month.monthLabel}</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Add FAB Button */}
      <div className="fixed right-6 bottom-22 z-40">
        <button
          type="button"
          onClick={() => setActiveTab('job_form')}
          className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center active:scale-90 transition-all duration-200 hover:bg-indigo-500 cursor-pointer"
          aria-label="Registrar novo trabalho"
          title="Novo Trabalho"
        >
          <Plus className="w-8 h-8 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
