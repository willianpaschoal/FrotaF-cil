import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { Job } from '../types';
import { JobCard } from './JobCard';
import { MaintenanceAlerts } from './MaintenanceAlerts';
import { Plus, Truck, Route, Clock, Banknote, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';

interface DashboardProps {
  onSelectJob?: (job: Job) => void;
  onOpenQuickAdd?: () => void;
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

export const Dashboard: React.FC<DashboardProps> = ({ onSelectJob, onOpenQuickAdd }) => {
  const {
    jobs,
    expenses,
    driverProfile,
    togglePrivacy,
    setActiveTab,
    selectedDate,
    setSelectedDate,
  } = useFleet();

  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const todayCardRef = React.useRef<HTMLButtonElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  // Generate extended date range for carousel (-10 days to +14 days from today)
  const carouselDays = React.useMemo(() => {
    const now = new Date();
    const days = [];
    const dayLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

    for (let i = -10; i <= 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const isoDate = `${year}-${monthNum}-${dayNum}`;
      const isToday = d.toDateString() === now.toDateString();

      const jobCountOnDate = jobs.filter(
        (j) => j.startDate === isoDate || j.endDate === isoDate
      ).length;

      days.push({
        dayLabel: dayLabels[d.getDay()],
        dayNum,
        monthNum,
        monthName: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        isoDate,
        formattedDate: `${dayNum}/${monthNum}`,
        isToday,
        jobCount: jobCountOnDate,
      });
    }
    return days;
  }, [jobs]);

  // Scroll to today's card on initial render
  React.useEffect(() => {
    if (todayCardRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        todayCardRef.current?.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }, 100);
    }
  }, []);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleGoToToday = () => {
    const todayIso = new Date().toISOString().split('T')[0];
    setSelectedDate(todayIso);
    if (todayCardRef.current) {
      todayCardRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  // Mouse Drag handlers for carousel
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftPos(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftPos - walk;
  };

  // Filter jobs by selected date
  const filteredJobs = React.useMemo(() => {
    if (!selectedDate) return jobs;
    return jobs.filter(
      (job) => job.startDate === selectedDate || job.endDate === selectedDate
    );
  }, [jobs, selectedDate]);

  const selectedDayInfo = carouselDays.find((d) => d.isoDate === selectedDate);

  // Current Year-Month
  const currentYearMonth = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  // Current month's jobs (Viagens e Serviços)
  const currentMonthJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      const dateStr = job.startDate || job.createdAt || '';
      const jobMonthKey = dateStr.substring(0, 7) || currentYearMonth;
      return jobMonthKey >= currentYearMonth;
    });
  }, [jobs, currentYearMonth]);

  // Current month's expenses (Despesas do Mês Atual)
  const currentMonthExpenses = React.useMemo(() => {
    return expenses.filter((e) => {
      const expMonth = (e.date || '').substring(0, 7);
      return !expMonth || expMonth === currentYearMonth || expMonth >= currentYearMonth;
    });
  }, [expenses, currentYearMonth]);

  // Calculate current month totals
  const currentMonthRevenue = React.useMemo(() => {
    return currentMonthJobs.reduce(
      (acc, j) => acc + (j.status !== 'Pendente' ? j.amount : 0),
      0
    );
  }, [currentMonthJobs]);

  const currentMonthExpensesTotal = React.useMemo(() => {
    return currentMonthExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [currentMonthExpenses]);

  const currentMonthKmTotal = React.useMemo(() => {
    return currentMonthJobs.reduce((acc, j) => {
      const km = j.kmTotal || (j.kmFinal && j.kmInitial && j.kmFinal > j.kmInitial ? j.kmFinal - j.kmInitial : 0);
      return acc + (km > 0 ? km : 0);
    }, 0);
  }, [currentMonthJobs]);

  const currentMonthNetBalance = currentMonthRevenue - currentMonthExpensesTotal;

  const displayRevenue = driverProfile.privacyHideFinancials
    ? 'R$ ••••••'
    : `R$ ${currentMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const displayNetBalance = driverProfile.privacyHideFinancials
    ? 'R$ ••••••'
    : `R$ ${currentMonthNetBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const displayExpenses = driverProfile.privacyHideFinancials
    ? 'R$ ••••••'
    : `R$ ${currentMonthExpensesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const displayMonthKm = `${currentMonthKmTotal.toLocaleString('pt-BR')} km`;

  const getStatusBadge = (status: Job['status']) => {
    switch (status) {
      case 'Finalizado':
        return (
          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Finalizado
          </span>
        );
      case 'Em Trânsito':
        return (
          <span className="px-2.5 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-xs">
            Em Trânsito
          </span>
        );
      case 'Pendente':
      case 'Agendado':
      default:
        return (
          <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Pendente
          </span>
        );
    }
  };

  const getJobIcon = (title: string, status: Job['status']) => {
    if (title.toLowerCase().includes('manutenção') || status === 'Pendente') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
          <Clock className="w-6 h-6" />
        </div>
      );
    }
    if (title.toLowerCase().includes('rota') || title.toLowerCase().includes('interestadual')) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
          <Route className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
        <Truck className="w-6 h-6" />
      </div>
    );
  };

  return (
    <div className="pt-18 pb-28 px-5 max-w-lg mx-auto flex flex-col gap-6">
      {/* Date Carousel Selector */}
      <section>
        <div className="flex justify-between items-center mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Dias da Semana
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleGoToToday}
              className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-bold rounded-lg transition-colors"
            >
              Hoje
            </button>

            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold rounded-lg transition-colors"
              >
                Todos
              </button>
            )}

            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={handleScrollLeft}
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700/50"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700/50"
                title="Próximo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Swipe / Drag Carousel Container */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          className="flex overflow-x-auto gap-2.5 hide-scrollbar py-2 -mx-2 px-2 scroll-smooth select-none cursor-grab active:cursor-grabbing snap-x"
        >
          {carouselDays.map((item) => {
            const isActive = selectedDate === item.isoDate;

            return (
              <button
                key={item.isoDate}
                ref={item.isToday ? todayCardRef : null}
                type="button"
                onClick={() => {
                  if (isActive) {
                    setSelectedDate(''); // Unselect to show all
                  } else {
                    setSelectedDate(item.isoDate);
                  }
                }}
                className={`flex-shrink-0 w-15 h-22 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer relative snap-center ${
                  isActive
                    ? 'date-card-active scale-105 text-white inner-glow ring-2 ring-indigo-400/80 shadow-lg shadow-indigo-600/30'
                    : 'card-3d text-slate-400 opacity-85 hover:opacity-100 hover:border-indigo-500/30'
                }`}
              >
                {item.isToday && (
                  <span
                    className={`absolute top-1 text-[8px] font-black tracking-wider uppercase px-1 rounded ${
                      isActive ? 'bg-white/25 text-white' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    Hoje
                  </span>
                )}

                <span
                  className={`text-[10px] font-semibold tracking-wider uppercase ${
                    item.isToday ? 'mt-3' : ''
                  } ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}
                >
                  {item.dayLabel}
                </span>

                <span
                  className={`text-base font-bold ${
                    isActive ? 'text-white' : 'text-slate-200'
                  }`}
                >
                  {item.dayNum}
                </span>

                <span className="text-[9px] text-slate-500 font-medium">
                  {item.monthName}
                </span>

                {item.jobCount > 0 && (
                  <span
                    className={`mt-0.5 px-1.5 py-0.2 text-[8px] font-extrabold rounded-full flex items-center gap-0.5 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    {item.jobCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Alertas de Manutenção da Frota */}
      <MaintenanceAlerts onOpenExpenses={() => setActiveTab('expenses')} />

      {/* Summary Card */}
      <section className="card-3d rounded-3xl p-6 relative overflow-hidden group border border-white/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Banknote className="w-24 h-24 text-indigo-400" />
        </div>

        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                Saldo do Mês Atual ({formatMonthYearBR(currentYearMonth)})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                Mês Atual
              </span>
              <button
                type="button"
                onClick={togglePrivacy}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                {driverProfile.privacyHideFinancials ? 'Revelar' : 'Ocultar'}
              </button>
            </div>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap mt-0.5">
            <span className="text-3xl font-extrabold text-white tracking-tight transition-all duration-300">
              {displayNetBalance}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <span>Saldo Líquido</span>
              <span>•</span>
              <span className="text-indigo-300">
                Faturamento: {displayRevenue}
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            {/* Despesas do Mês Atual */}
            <div className="flex-1 bg-[#1E2129] rounded-2xl p-3.5 flex flex-col border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Despesas</span>
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                  Mês Atual
                </span>
              </div>
              <span className="text-base font-bold text-rose-400 mt-1 truncate">
                {displayExpenses}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-1">
                {currentMonthExpenses.length} {currentMonthExpenses.length === 1 ? 'despesa no mês' : 'despesas no mês'}
              </span>
            </div>

            {/* KM Rodados */}
            <div className="flex-1 bg-[#1E2129] rounded-2xl p-3.5 flex flex-col border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">KM Rodados</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  Mês Atual
                </span>
              </div>
              <span className="text-base font-bold text-emerald-400 mt-1 truncate">
                {displayMonthKm}
              </span>
              <span className="text-[10px] text-emerald-400/80 font-semibold mt-1">
                Percorridos no mês atual
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs List */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Trabalhos Recentes</h3>
            {selectedDayInfo && (
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-full flex items-center gap-1">
                {selectedDayInfo.dayLabel} ({selectedDayInfo.formattedDate})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                Limpar filtro
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className="text-indigo-400 text-xs font-bold hover:underline flex items-center gap-1"
            >
              Ver todos
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredJobs.length === 0 ? (
            <div className="card-3d rounded-2xl p-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2 border border-slate-800">
              <Truck className="w-8 h-8 text-slate-600 stroke-1" />
              <p className="text-xs font-semibold">Nenhum trabalho cadastrado para esta data.</p>
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-xs text-indigo-400 font-bold hover:underline mt-1"
              >
                Ver todos os trabalhos
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                privacyHideFinancials={driverProfile.privacyHideFinancials}
                onClick={() => onSelectJob?.(job)}
                onOpenDetails={() => onSelectJob?.(job)}
              />
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-4 text-center">
        <span className="text-xs font-semibold text-slate-500">FrotaFácil v1.8.8 • Elegant Dark</span>
      </footer>

      {/* Quick Add FAB Menu */}
      <div className="fixed right-6 bottom-22 z-40">
        {showQuickMenu && (
          <div className="mb-3 flex flex-col gap-2 items-end animate-in fade-in slide-in-from-bottom-3 duration-200">
            <button
              type="button"
              onClick={() => {
                setShowQuickMenu(false);
                setActiveTab('job_form');
              }}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg font-bold text-xs flex items-center gap-2 hover:bg-indigo-500 transition-all border border-indigo-400/30"
            >
              <Truck className="w-4 h-4" />
              Novo Trabalho
            </button>
            <button
              type="button"
              onClick={() => {
                setShowQuickMenu(false);
                setActiveTab('expenses');
              }}
              className="px-4 py-2.5 bg-[#1E2129] text-white rounded-xl shadow-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-700 transition-all border border-white/10"
            >
              <Banknote className="w-4 h-4" />
              Nova Despesa
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (onOpenQuickAdd) {
              onOpenQuickAdd();
            } else {
              setShowQuickMenu(!showQuickMenu);
            }
          }}
          className={`w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center active:scale-90 transition-all duration-200 hover:bg-indigo-500 ${
            showQuickMenu ? 'rotate-45 bg-indigo-700' : ''
          }`}
          aria-label="Adicionar novo item"
        >
          <Plus className="w-8 h-8 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
