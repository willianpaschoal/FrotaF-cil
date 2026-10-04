import React, { useState } from 'react';
import { Expense } from '../types';
import {
  Fuel,
  Ticket,
  Utensils,
  Wrench,
  Tag,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Truck,
  Gauge,
  Zap,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseCardProps {
  expense: Expense;
  privacyHideFinancials?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  calculateKmL?: (item: Expense) => string | null;
  getCategoryIcon?: (catKey: string) => React.ReactNode;
  getCategoryName?: (catKey: string) => string;
  vehicleModel?: string;
  vehicleImg?: string;
}

export const formatDateBR = (dateStr?: string) => {
  if (!dateStr) return '--/--/----';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  privacyHideFinancials,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  calculateKmL,
  getCategoryIcon,
  getCategoryName,
  vehicleModel,
  vehicleImg,
}) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const effectiveExpanded = isExpanded !== undefined ? isExpanded : localExpanded;

  const handleToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setLocalExpanded((prev) => !prev);
    }
  };

  const defaultCategoryIcon = (key: string) => {
    switch (key) {
      case 'combustivel':
        return <Fuel className="w-5 h-5 text-amber-400" />;
      case 'pedagio':
        return <Ticket className="w-5 h-5 text-sky-400" />;
      case 'alimentacao':
        return <Utensils className="w-5 h-5 text-emerald-400" />;
      case 'manutencao':
        return <Wrench className="w-5 h-5 text-rose-400" />;
      default:
        return <Tag className="w-5 h-5 text-indigo-400" />;
    }
  };

  const iconNode = getCategoryIcon ? getCategoryIcon(expense.category) : defaultCategoryIcon(expense.category);
  const categoryLabel = getCategoryName
    ? getCategoryName(expense.category)
    : expense.category.charAt(0).toUpperCase() + expense.category.slice(1);

  const kmL = calculateKmL ? calculateKmL(expense) : null;

  return (
    <div
      className={`card-3d rounded-2xl transition-all duration-200 bg-[#12141C] border overflow-hidden ${
        effectiveExpanded
          ? 'border-indigo-500/50 shadow-[0_8px_25px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/20'
          : 'border-white/10 hover:border-white/20 hover:bg-[#151824]'
      }`}
    >
      {/* Miniature Header: Always visible, clickable to toggle */}
      <div
        onClick={handleToggle}
        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none group"
      >
        {/* Left: Thumbnail & Main Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Category Icon / Vehicle Photo */}
          <div className="relative shrink-0">
            {vehicleImg ? (
              <img
                src={vehicleImg}
                alt={expense.vehiclePlate}
                className="w-11 h-11 rounded-xl object-cover border border-white/15 shadow-sm group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-[#1E2129] border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {iconNode}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#1E2129] border border-white/10">
              {expense.category === 'combustivel' ? (
                <Fuel className="w-2.5 h-2.5 text-amber-400" />
              ) : expense.category === 'manutencao' ? (
                <Wrench className="w-2.5 h-2.5 text-rose-400" />
              ) : (
                <Tag className="w-2.5 h-2.5 text-indigo-400" />
              )}
            </div>
          </div>

          {/* Core Info */}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {expense.code || '#DES'}
              </span>
              <span className="px-2 py-0.2 rounded-md bg-white/5 text-slate-300 text-[10px] font-bold border border-white/5 uppercase">
                {categoryLabel}
              </span>
              {(expense.category === 'manutencao' || expense.category === 'manutenção') && expense.maintenanceType && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[9.5px] font-extrabold border ${
                    expense.maintenanceType === 'troca_oleo'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  {expense.maintenanceType === 'troca_oleo' ? 'Troca de Óleo' : 'Troca de Peças'}
                  {expense.maintenanceType === 'troca_oleo' && expense.currentKm ? ` • ${expense.currentKm.toLocaleString('pt-BR')} km` : ''}
                </span>
              )}
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full ${
                  expense.status === 'Pago'
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                {expense.status}
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-white leading-tight truncate group-hover:text-indigo-300 transition-colors">
              {expense.title}
            </h4>

            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 truncate">
              <span className="font-mono text-slate-300 font-semibold">{expense.vehiclePlate}</span>
              <span className="opacity-40">•</span>
              <span>{formatDateBR(expense.date)}</span>
              {expense.time && (
                <>
                  <span className="opacity-40">•</span>
                  <span>{expense.time}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amount & Expand button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-xs sm:text-sm font-extrabold text-rose-400 leading-none">
              {privacyHideFinancials
                ? 'R$ •••'
                : `R$ ${expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </span>
            {expense.fuelLiters && (
              <span className="text-[10px] text-amber-300 font-mono font-medium mt-1">
                {expense.fuelLiters.toFixed(1)} L
              </span>
            )}
            {!expense.fuelLiters && expense.kmDriven && (
              <span className="text-[10px] text-sky-300 font-mono font-medium mt-1">
                {expense.kmDriven} km
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggle}
            aria-label={effectiveExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
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
      </div>

      {/* Expanded Details Section: Revealed smoothly upon click */}
      <AnimatePresence initial={false}>
        {effectiveExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="border-t border-white/10 bg-[#0B0C12]/90 p-4 flex flex-col gap-3.5"
          >
            {/* Header info badge row */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Detalhamento da Despesa
                </span>
              </div>
              <span className="text-[10.5px] font-mono text-slate-400 font-bold">
                {expense.code || '#DES'}
              </span>
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Categoria */}
              <div className="p-2.5 rounded-xl bg-[#141620] border border-white/5">
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                  Categoria
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  {categoryLabel}
                </span>
              </div>

              {/* Veículo & Placa */}
              <div className="p-2.5 rounded-xl bg-[#141620] border border-white/5">
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                  Veículo / Placa
                </span>
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  {expense.vehiclePlate}
                </span>
                {vehicleModel && (
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                    {vehicleModel}
                  </span>
                )}
              </div>

              {/* Data e Hora */}
              <div className="p-2.5 rounded-xl bg-[#141620] border border-white/5">
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                  Data do Registro
                </span>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDateBR(expense.date)}
                </span>
                {expense.time && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {expense.time}
                  </span>
                )}
              </div>

              {/* Valor / Status */}
              <div className="p-2.5 rounded-xl bg-[#141620] border border-white/5">
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                  Valor Total
                </span>
                <span className="text-xs font-black text-rose-400">
                  {privacyHideFinancials
                    ? 'R$ •••••'
                    : `R$ ${expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                  Status: {expense.status}
                </span>
              </div>

              {/* Cliente Associado se houver */}
              {expense.clientName && (
                <div className="p-2.5 rounded-xl bg-[#141620] border border-white/5 col-span-2">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                    Cliente / Destino Vinculado
                  </span>
                  <span className="text-xs font-bold text-indigo-300 truncate block">
                    {expense.clientName}
                  </span>
                </div>
              )}
            </div>

            {/* Combustível Specific Section */}
            {expense.category === 'combustivel' &&
              (expense.fuelPricePerLiter ||
                expense.fuelLiters ||
                expense.kmAtRefuel ||
                expense.kmDriven ||
                kmL) && (
                <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 flex flex-col gap-2">
                  <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5" />
                    Parâmetros de Abastecimento
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {expense.fuelPricePerLiter && (
                      <div className="bg-[#12141C] p-2 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-400 block">Preço / Litro</span>
                        <span className="font-extrabold text-amber-400">
                          R$ {expense.fuelPricePerLiter.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {expense.fuelLiters && (
                      <div className="bg-[#12141C] p-2 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-400 block">Litros</span>
                        <span className="font-extrabold text-white">
                          {expense.fuelLiters.toFixed(2)} L
                        </span>
                      </div>
                    )}

                    {expense.kmAtRefuel && (
                      <div className="bg-[#12141C] p-2 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-400 block">Hodômetro</span>
                        <span className="font-bold text-slate-300 font-mono">
                          {expense.kmAtRefuel.toLocaleString('pt-BR')} km
                        </span>
                      </div>
                    )}

                    {expense.kmDriven && (
                      <div className="bg-[#12141C] p-2 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-400 block">KM Rodados</span>
                        <span className="font-bold text-sky-300 font-mono">
                          {expense.kmDriven} km
                        </span>
                      </div>
                    )}
                  </div>

                  {kmL && (
                    <div className="mt-1 flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs">
                      <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        Consumo Médio Calculado:
                      </span>
                      <span className="font-black text-emerald-400 text-sm">
                        {kmL} km/L
                      </span>
                    </div>
                  )}
                </div>
              )}

            {/* Manutenção Specific Section */}
            {(expense.category === 'manutencao' || expense.category === 'manutenção') && expense.maintenanceType && (
              <div className="p-3 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/20 flex flex-col gap-2">
                <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Detalhes da Manutenção
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#12141C] p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Tipo de Serviço</span>
                    <span className="font-extrabold text-white">
                      {expense.maintenanceType === 'troca_oleo' ? 'Troca de Óleo' : 'Troca de Peças'}
                    </span>
                  </div>

                  {expense.maintenanceType === 'troca_oleo' && expense.currentKm && (
                    <div className="bg-[#12141C] p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] text-slate-400 block">Hodômetro na Troca</span>
                      <span className="font-bold text-amber-400 font-mono">
                        {expense.currentKm.toLocaleString('pt-BR')} km
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Observações / Notas */}
            {expense.notes && (
              <div className="p-3 rounded-xl bg-[#141620] border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Observações / Detalhes
                </span>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{expense.notes}"
                </p>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(expense);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(expense);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                )}
              </div>

              {/* Explicit Collapse button */}
              <button
                type="button"
                onClick={handleToggle}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors border border-white/5"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                Recolher
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
