import React, { useState, useMemo, useRef } from 'react';
import { useFleet } from '../context/FleetContext';
import { Expense, ExpenseCategory } from '../types';
import { getPreviousDayFinalKm } from '../utils/odometer';
import { ExpenseCard } from './ExpenseCard';
import {
  Wallet,
  Fuel,
  Ticket,
  Utensils,
  Wrench,
  Plus,
  X,
  Check,
  Search,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  Filter,
  Layers,
  Truck,
  Tag,
  ChevronLeft,
  ChevronRight,
  Archive,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Sparkles,
  CalendarCheck2,
  FolderArchive,
  CheckCircle2,
  Gauge,
  Droplets,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

export const Expenses: React.FC = () => {
  const { jobs, expenses, vehicles, driverProfile, categories, addExpense, updateExpense, deleteExpense, updateVehicle } = useFleet();

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<'all' | ExpenseCategory>('all');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('combustivel');
  const [amount, setAmount] = useState('');
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [kmAtRefuel, setKmAtRefuel] = useState('');
  const [kmDriven, setKmDriven] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<'troca_pecas' | 'troca_oleo'>('troca_oleo');
  const [currentVehicleKm, setCurrentVehicleKm] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState(vehicles[0]?.plate || 'ABC-1234');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Pago' | 'Pendente'>('Pago');

  // Helper to retrieve the kmFinal (card do dia anterior) and sum of km driven in work jobs performed after the last registered expense (or all jobs if no expenses exist)
  const getLastJobInfo = (plate?: string, targetDate?: string) => {
    const targetPlate = plate || vehiclePlate || vehicles[0]?.plate || '';
    const dateToCheck = targetDate || date || new Date().toISOString().split('T')[0];

    // O KM final do card do dia anterior
    const prevDayKm = getPreviousDayFinalKm(jobs, dateToCheck, targetPlate, vehicles);
    const kmFinal = prevDayKm !== '' ? prevDayKm.toString() : '';

    if (!jobs || jobs.length === 0) return { kmFinal, kmDriven: '', jobCount: 0, hasExpense: false };

    let vehicleJobs = jobs.filter((j) => j.vehiclePlate === targetPlate);
    if (vehicleJobs.length === 0 && (!plate || targetPlate === '')) {
      vehicleJobs = jobs;
    }

    if (vehicleJobs.length === 0) return { kmFinal, kmDriven: '', jobCount: 0, hasExpense: false };

    // Find latest expense for this vehicle (preferring fuel expense, or any expense)
    const vehicleFuelExpenses = expenses
      .filter((e) => (!targetPlate || e.vehiclePlate === targetPlate) && e.category === 'combustivel')
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime() || 0;
        const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime() || 0;
        return timeB - timeA;
      });

    const vehicleAllExpenses = expenses
      .filter((e) => !targetPlate || e.vehiclePlate === targetPlate)
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime() || 0;
        const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime() || 0;
        return timeB - timeA;
      });

    const latestExpense = vehicleFuelExpenses[0] || vehicleAllExpenses[0];

    let jobsAfterExpense: typeof vehicleJobs = [];

    if (latestExpense) {
      const expenseTime = new Date(`${latestExpense.date}T${latestExpense.time || '00:00'}`).getTime() || 0;
      const expenseKm = latestExpense.kmAtRefuel || 0;

      jobsAfterExpense = vehicleJobs.filter((j) => {
        // Priority 1: Check by KM if expense recorded kmAtRefuel
        if (expenseKm > 0) {
          if (j.kmFinal && j.kmFinal > expenseKm) return true;
          if (j.kmInitial && j.kmInitial >= expenseKm) return true;
          return false;
        }

        // Priority 2: Check by date/time
        const jobTime = new Date(`${j.endDate || j.startDate}T${j.endTime || j.startTime || '00:00'}`).getTime() || 0;
        return jobTime >= expenseTime;
      });
    } else {
      // If no previous expense for this vehicle, sum ALL work cards for this vehicle
      jobsAfterExpense = vehicleJobs;
    }

    // Sum total percorrido (kmTotal) of all job cards
    const totalKmDriven = jobsAfterExpense.reduce((sum, j) => {
      const driven = j.kmTotal || (j.kmFinal && j.kmInitial ? j.kmFinal - j.kmInitial : 0);
      return sum + (driven > 0 ? driven : 0);
    }, 0);

    return {
      kmFinal,
      kmDriven: totalKmDriven > 0 ? totalKmDriven.toString() : '',
      jobCount: jobsAfterExpense.length,
      hasExpense: !!latestExpense,
    };
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  const scrollContainer = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 240;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftPos(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    scrollRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Unified categories (Settings categories + any category present in existing expenses)
  const displayCategories = useMemo(() => {
    const list = [...categories];
    expenses.forEach((e) => {
      if (!e.category) return;
      const exists = list.some(
        (c) => c.key.toLowerCase() === e.category.toLowerCase() || c.name.toLowerCase() === e.category.toLowerCase()
      );
      if (!exists) {
        list.push({
          id: `cat-exp-${e.category}`,
          name: e.category.charAt(0).toUpperCase() + e.category.slice(1),
          key: e.category,
        });
      }
    });
    return list;
  }, [categories, expenses]);

  // Totals calculation per category
  const categoryTotals = useMemo(() => {
    const totals: Record<string, { amount: number; count: number }> = {
      all: { amount: 0, count: expenses.length },
    };

    displayCategories.forEach((cat) => {
      totals[cat.key] = { amount: 0, count: 0 };
    });

    expenses.forEach((e) => {
      totals.all.amount += e.amount;
      const matchCat = displayCategories.find(
        (c) => c.key === e.category || c.name.toLowerCase() === e.category.toLowerCase()
      );
      const targetKey = matchCat ? matchCat.key : e.category;

      if (!totals[targetKey]) {
        totals[targetKey] = { amount: 0, count: 0 };
      }
      totals[targetKey].amount += e.amount;
      totals[targetKey].count += 1;
    });

    return totals;
  }, [expenses, displayCategories]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (selectedCategory !== 'all') {
        const matchCat = displayCategories.find(
          (c) => c.key === selectedCategory || c.id === selectedCategory
        );
        const targetKey = matchCat ? matchCat.key : selectedCategory;
        const targetName = matchCat ? matchCat.name.toLowerCase() : selectedCategory.toLowerCase();
        const expCatLower = exp.category.toLowerCase();

        if (expCatLower !== targetKey.toLowerCase() && expCatLower !== targetName) {
          return false;
        }
      }
      if (selectedVehicleFilter !== 'all' && exp.vehiclePlate !== selectedVehicleFilter) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchTitle = exp.title.toLowerCase().includes(term);
        const matchNotes = exp.notes?.toLowerCase().includes(term);
        const matchPlate = exp.vehiclePlate.toLowerCase().includes(term);
        const matchDate = exp.date.includes(term);
        if (!matchTitle && !matchNotes && !matchPlate && !matchDate) return false;
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedVehicleFilter, searchTerm, displayCategories]);

  // Current YYYY-MM
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  // Group expenses into:
  // 1. Current Month (Mês Atual)
  // 2. Past Months (Meses Anteriores Encerrados)
  const { currentMonthExpenses, pastMonthsList } = useMemo(() => {
    const current: Expense[] = [];
    const pastMap: Record<string, Expense[]> = {};

    filteredExpenses.forEach((exp) => {
      const expMonth = (exp.date || '').substring(0, 7);
      if (!expMonth || expMonth === currentYearMonth || expMonth >= currentYearMonth) {
        current.push(exp);
      } else {
        if (!pastMap[expMonth]) {
          pastMap[expMonth] = [];
        }
        pastMap[expMonth].push(exp);
      }
    });

    const sortedPastKeys = Object.keys(pastMap).sort((a, b) => b.localeCompare(a));
    const pastMonths = sortedPastKeys.map((monthKey) => {
      const mExpenses = pastMap[monthKey];
      const totalAmount = mExpenses.reduce((acc, e) => acc + e.amount, 0);
      const paidCount = mExpenses.filter((e) => e.status === 'Pago').length;
      const fuelLiters = mExpenses.reduce((acc, e) => acc + (e.fuelLiters || 0), 0);

      return {
        monthKey,
        monthLabel: formatMonthYearBR(monthKey),
        expenses: mExpenses,
        totalAmount,
        totalCount: mExpenses.length,
        paidCount,
        fuelLiters,
      };
    });

    return {
      currentMonthExpenses: current,
      pastMonthsList: pastMonths,
    };
  }, [filteredExpenses, currentYearMonth]);

  const totalExpense = currentMonthExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Controlled expansion state for miniature cards
  const [expandedExpenseIds, setExpandedExpenseIds] = useState<Record<string, boolean>>({});
  // Controlled expansion state for past months
  const [expandedPastMonths, setExpandedPastMonths] = useState<Record<string, boolean>>({});

  const toggleExpenseExpansion = (id: string) => {
    setExpandedExpenseIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const togglePastMonthExpansion = (monthKey: string) => {
    setExpandedPastMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const areAllExpensesExpanded = useMemo(() => {
    if (currentMonthExpenses.length === 0) return false;
    return currentMonthExpenses.every((e) => expandedExpenseIds[e.id]);
  }, [currentMonthExpenses, expandedExpenseIds]);

  const toggleAllExpenses = () => {
    if (areAllExpensesExpanded) {
      setExpandedExpenseIds({});
    } else {
      const next: Record<string, boolean> = {};
      currentMonthExpenses.forEach((e) => {
        next[e.id] = true;
      });
      setExpandedExpenseIds(next);
    }
  };

  const getCategoryIcon = (cat: string) => {
    const key = cat.toLowerCase();
    switch (key) {
      case 'combustivel':
        return <Fuel className="w-5 h-5 text-rose-400" />;
      case 'pedagio':
        return <Ticket className="w-5 h-5 text-amber-400" />;
      case 'alimentacao':
        return <Utensils className="w-5 h-5 text-emerald-400" />;
      case 'manutencao':
        return <Wrench className="w-5 h-5 text-indigo-400" />;
      default:
        return <Tag className="w-5 h-5 text-sky-400" />;
    }
  };

  const getCategoryCardStyle = (key: string, isSelected: boolean) => {
    const k = key.toLowerCase();
    if (isSelected) {
      if (k === 'combustivel') return 'bg-rose-600/20 border-rose-500 ring-2 ring-rose-500/40 text-white shadow-lg';
      if (k === 'pedagio') return 'bg-amber-600/20 border-amber-500 ring-2 ring-amber-500/40 text-white shadow-lg';
      if (k === 'alimentacao') return 'bg-emerald-600/20 border-emerald-500 ring-2 ring-emerald-500/40 text-white shadow-lg';
      if (k === 'manutencao') return 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40 text-white shadow-lg';
      return 'bg-sky-600/20 border-sky-500 ring-2 ring-sky-500/40 text-white shadow-lg';
    }
    return 'card-3d bg-[#12141C] border-white/10 text-slate-400 hover:border-slate-600 hover:text-slate-200';
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory('combustivel');
    setAmount('');
    setFuelPricePerLiter('');
    setFuelLiters('');
    setMaintenanceType('troca_oleo');
    const defaultPlate = driverProfile.defaultVehiclePlate || vehicles[0]?.plate || 'ABC-1234';
    setVehiclePlate(defaultPlate);
    const today = new Date().toISOString().split('T')[0];
    setDate(today);

    // No card de despesas no campo Odômetro (KM Atual), aparece o km final do card do dia anterior
    const prevDayKm = getPreviousDayFinalKm(jobs, today, defaultPlate, vehicles);
    const prevDayKmStr = prevDayKm !== '' ? prevDayKm.toString() : '';
    setKmAtRefuel(prevDayKmStr);
    setCurrentVehicleKm(prevDayKmStr);

    const lastInfo = getLastJobInfo(defaultPlate, today);
    setKmDriven(lastInfo.kmDriven);
    setNotes('');
    setStatus('Pago');
    setShowModal(true);
  };

  const handleVehicleChange = (newPlate: string) => {
    setVehiclePlate(newPlate);
    if (!editingExpense) {
      const prevDayKm = getPreviousDayFinalKm(jobs, date, newPlate, vehicles);
      const prevDayKmStr = prevDayKm !== '' ? prevDayKm.toString() : '';
      setKmAtRefuel(prevDayKmStr);
      setCurrentVehicleKm(prevDayKmStr);

      const lastInfo = getLastJobInfo(newPlate, date);
      setKmDriven(lastInfo.kmDriven);
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (!editingExpense) {
      const prevDayKm = getPreviousDayFinalKm(jobs, newDate, vehiclePlate, vehicles);
      const prevDayKmStr = prevDayKm !== '' ? prevDayKm.toString() : '';
      setKmAtRefuel(prevDayKmStr);
      setCurrentVehicleKm(prevDayKmStr);

      const lastInfo = getLastJobInfo(vehiclePlate, newDate);
      setKmDriven(lastInfo.kmDriven);
    }
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(exp.amount.toString());
    setFuelPricePerLiter(exp.fuelPricePerLiter ? exp.fuelPricePerLiter.toString() : '');
    setFuelLiters(exp.fuelLiters ? exp.fuelLiters.toString() : '');
    setKmAtRefuel(exp.kmAtRefuel ? exp.kmAtRefuel.toString() : '');
    setKmDriven(exp.kmDriven ? exp.kmDriven.toString() : '');
    setMaintenanceType(exp.maintenanceType || 'troca_oleo');
    setCurrentVehicleKm(exp.currentKm ? exp.currentKm.toString() : '');
    setVehiclePlate(exp.vehiclePlate);
    setNotes(exp.notes || '');
    setDate(exp.date || new Date().toISOString().split('T')[0]);
    setStatus(exp.status || 'Pago');
    setShowModal(true);
  };

  // Helper auto-calculations
  const handleAmountChange = (val: string) => {
    setAmount(val);
    const numAmount = parseFloat(val.replace(',', '.'));
    const numPrice = parseFloat(fuelPricePerLiter.replace(',', '.'));
    if (category === 'combustivel' && !isNaN(numAmount) && !isNaN(numPrice) && numPrice > 0) {
      setFuelLiters((numAmount / numPrice).toFixed(2));
    }
  };

  const handlePricePerLiterChange = (val: string) => {
    setFuelPricePerLiter(val);
    const numPrice = parseFloat(val.replace(',', '.'));
    const numAmount = parseFloat(amount.replace(',', '.'));
    const numLiters = parseFloat(fuelLiters.replace(',', '.'));

    if (category === 'combustivel' && !isNaN(numPrice) && numPrice > 0) {
      if (!isNaN(numAmount) && numAmount > 0) {
        setFuelLiters((numAmount / numPrice).toFixed(2));
      } else if (!isNaN(numLiters) && numLiters > 0) {
        setAmount((numLiters * numPrice).toFixed(2));
      }
    }
  };

  const handleLitersChange = (val: string) => {
    setFuelLiters(val);
    const numLiters = parseFloat(val.replace(',', '.'));
    const numPrice = parseFloat(fuelPricePerLiter.replace(',', '.'));
    const numAmount = parseFloat(amount.replace(',', '.'));

    if (category === 'combustivel' && !isNaN(numLiters) && numLiters > 0) {
      if (!isNaN(numPrice) && numPrice > 0) {
        setAmount((numLiters * numPrice).toFixed(2));
      } else if (!isNaN(numAmount) && numAmount > 0) {
        setFuelPricePerLiter((numAmount / numLiters).toFixed(2));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const numAmount = parseFloat(amount.replace(',', '.')) || 0;
    const numPrice =
      category === 'combustivel' && fuelPricePerLiter
        ? parseFloat(fuelPricePerLiter.replace(',', '.'))
        : undefined;
    const numLiters =
      category === 'combustivel' && fuelLiters
        ? parseFloat(fuelLiters.replace(',', '.'))
        : undefined;
    const numKm =
      category === 'combustivel' && kmAtRefuel
        ? parseFloat(kmAtRefuel.replace(',', '.'))
        : undefined;
    const numKmDriven =
      category === 'combustivel' && kmDriven
        ? parseFloat(kmDriven.replace(',', '.'))
        : undefined;

    const isMaintenance = category.toLowerCase() === 'manutencao' || category.toLowerCase() === 'manutenção';
    const numCurrentKm =
      isMaintenance && maintenanceType === 'troca_oleo' && currentVehicleKm
        ? parseFloat(currentVehicleKm.replace(',', '.'))
        : undefined;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        title: title.trim(),
        category,
        amount: numAmount,
        fuelPricePerLiter: numPrice,
        fuelLiters: numLiters,
        kmAtRefuel: numKm,
        kmDriven: numKmDriven,
        maintenanceType: isMaintenance ? maintenanceType : undefined,
        currentKm: numCurrentKm,
        date,
        vehiclePlate,
        notes,
        status,
      });
    } else {
      addExpense({
        title: title.trim(),
        category,
        amount: numAmount,
        fuelPricePerLiter: numPrice,
        fuelLiters: numLiters,
        kmAtRefuel: numKm,
        kmDriven: numKmDriven,
        maintenanceType: isMaintenance ? maintenanceType : undefined,
        currentKm: numCurrentKm,
        date,
        time: '12:00',
        vehiclePlate,
        notes,
        status,
      });
    }

    // Se for troca de óleo com quilometragem informada, atualiza o hodômetro do veículo e histórico de revisão
    if (isMaintenance && maintenanceType === 'troca_oleo' && numCurrentKm && numCurrentKm > 0) {
      const targetVehicle = vehicles.find((v) => v.plate === vehiclePlate);
      if (targetVehicle) {
        updateVehicle(targetVehicle.id, {
          kmCurrent: Math.max(targetVehicle.kmCurrent || 0, numCurrentKm),
          lastMaintenanceKm: numCurrentKm,
          lastMaintenanceDate: date,
        });
      }
    }

    setShowModal(false);
  };

  // Calculate km/l for a fuel expense card by finding kmDriven or previous refuel for same vehicle
  const calculateKmL = (item: Expense) => {
    if (item.category !== 'combustivel' || !item.fuelLiters || item.fuelLiters <= 0) {
      return null;
    }

    // Direct KM Driven specified on this expense
    if (item.kmDriven && item.kmDriven > 0) {
      return (item.kmDriven / item.fuelLiters).toFixed(2);
    }

    // Odometer delta calculation
    if (item.kmAtRefuel) {
      const vehicleFuelExpenses = expenses
        .filter((e) => e.vehiclePlate === item.vehiclePlate && e.category === 'combustivel' && e.kmAtRefuel)
        .sort((a, b) => (a.kmAtRefuel || 0) - (b.kmAtRefuel || 0));

      const currentIndex = vehicleFuelExpenses.findIndex((e) => e.id === item.id);
      if (currentIndex > 0) {
        const prevExpense = vehicleFuelExpenses[currentIndex - 1];
        if (prevExpense && prevExpense.kmAtRefuel && item.kmAtRefuel > prevExpense.kmAtRefuel) {
          const deltaKm = item.kmAtRefuel - prevExpense.kmAtRefuel;
          return (deltaKm / item.fuelLiters).toFixed(2);
        }
      }
    }

    return null;
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="pt-18 pb-28 px-5 max-w-lg mx-auto flex flex-col gap-5">
      {/* Title & Action */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Despesas</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Controle de combustível, pedágio e manutenção.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-indigo-600 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-md hover:bg-indigo-500 active:scale-95 transition-all border border-indigo-400/30 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nova Despesa</span>
        </button>
      </div>

      {/* Summary Card */}
      <section className="card-3d rounded-3xl p-5 flex flex-col gap-2 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total de Despesas ({formatMonthYearBR(currentYearMonth)})
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
            Mês Atual
          </span>
        </div>
        <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
          {driverProfile.privacyHideFinancials
            ? 'R$ ••••••'
            : `R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        </span>
      </section>

      {/* Category Filter Cards */}
      <section className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Filtro por Categoria
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollContainer('left')}
                className="p-1 rounded-lg bg-[#1E2129] border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                title="Rolar para esquerda"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollContainer('right')}
                className="p-1 rounded-lg bg-[#1E2129] border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                title="Rolar para direita"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {(selectedCategory !== 'all' || selectedVehicleFilter !== 'all' || searchTerm !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedVehicleFilter('all');
                  setSearchTerm('');
                }}
                className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer ml-1"
              >
                <X className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filter Cards Horizontal Carousel */}
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          className="flex overflow-x-auto overflow-y-hidden gap-2.5 hide-scrollbar py-1.5 -mx-2 px-2 select-none touch-pan-x cursor-grab active:cursor-grabbing scroll-smooth w-full shrink-0"
        >
          {/* Card Todos */}
          <button
            type="button"
            onClick={() => {
              if (hasDragged) return;
              setSelectedCategory('all');
            }}
            className={`flex-shrink-0 w-28 p-3 rounded-2xl flex flex-col justify-between transition-all duration-200 cursor-pointer border text-left ${
              selectedCategory === 'all'
                ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40 text-white shadow-lg'
                : 'card-3d bg-[#12141C] border-white/10 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${selectedCategory === 'all' ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                <Layers className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${selectedCategory === 'all' ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-800 text-slate-400'}`}>
                {categoryTotals.all?.count || 0}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-300 block truncate">Todas</span>
            <span className="text-xs font-black text-white mt-0.5 truncate">
              {driverProfile.privacyHideFinancials
                ? 'R$ •••'
                : `R$ ${(categoryTotals.all?.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
            </span>
          </button>

          {/* Dynamic Category Cards */}
          {displayCategories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const totalData = categoryTotals[cat.key] || { amount: 0, count: 0 };

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (hasDragged) return;
                  setSelectedCategory(isSelected ? 'all' : (cat.key as any));
                }}
                className={`flex-shrink-0 w-28 p-3 rounded-2xl flex flex-col justify-between transition-all duration-200 cursor-pointer border text-left ${getCategoryCardStyle(
                  cat.key,
                  isSelected
                )}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800'}`}>
                    {getCategoryIcon(cat.key)}
                  </div>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-800 text-slate-400'}`}>
                    {totalData.count}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-300 block truncate">{cat.name}</span>
                <span className="text-xs font-black text-white mt-0.5 truncate">
                  {driverProfile.privacyHideFinancials
                    ? 'R$ •••'
                    : `R$ ${totalData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Vehicle Filter Row */}
        <div className="flex gap-2 items-center mt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar despesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#12141C] border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500/60 transition-all placeholder:text-slate-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedVehicleFilter}
            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
            className="py-2 px-2.5 bg-[#12141C] border border-white/10 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500/60 transition-all cursor-pointer"
          >
            <option value="all">Todos Veículos</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.plate}>
                {v.plate}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Expenses List */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Lançamentos de Despesas
              {filteredExpenses.length !== expenses.length && (
                <span className="text-xs font-normal text-slate-400 ml-2">
                  ({filteredExpenses.length} de {expenses.length})
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Cards em miniatura interativos. Clique em qualquer card para expandir detalhes.
            </p>
          </div>

          {filteredExpenses.length > 0 && (
            <button
              type="button"
              onClick={toggleAllExpenses}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              {areAllExpensesExpanded ? 'Recolher Todos' : 'Expandir Todos'}
            </button>
          )}
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 bg-[#12141C] border border-white/5 rounded-3xl p-6 text-slate-400 flex flex-col items-center">
            <Wallet className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-bold text-white">
              {expenses.length === 0 ? 'Nenhuma despesa registrada' : 'Nenhuma despesa encontrada'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {expenses.length === 0
                ? 'Clique em "Nova Despesa" para cadastrar lançamentos.'
                : 'Nenhum lançamento corresponde aos filtros selecionados.'}
            </p>
            {expenses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedVehicleFilter('all');
                  setSearchTerm('');
                }}
                className="mt-3 px-3.5 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold text-xs hover:bg-indigo-600/30 transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* SEÇÃO 1: MÊS ATUAL */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Mês Atual ({formatMonthYearBR(currentYearMonth)})
                  </h4>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {currentMonthExpenses.length} {currentMonthExpenses.length === 1 ? 'despesa' : 'despesas'}
                </span>
              </div>

              {currentMonthExpenses.length === 0 ? (
                <div className="py-6 px-4 bg-[#12141C] rounded-2xl border border-white/5 text-center text-slate-400 text-xs">
                  Nenhuma despesa registrada neste mês atual até o momento.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {currentMonthExpenses.map((item) => (
                    <ExpenseCard
                      key={item.id}
                      expense={item}
                      privacyHideFinancials={driverProfile.privacyHideFinancials}
                      isExpanded={!!expandedExpenseIds[item.id]}
                      onToggleExpand={() => toggleExpenseExpansion(item.id)}
                      onEdit={handleOpenEdit}
                      onDelete={(exp) => setExpenseToDelete(exp)}
                      calculateKmL={calculateKmL}
                      getCategoryIcon={getCategoryIcon}
                      vehicleModel={vehicles.find((v) => v.plate === item.vehiclePlate)?.model}
                      vehicleImg={vehicles.find((v) => v.plate === item.vehiclePlate)?.image}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* SEÇÃO 2: MESES ANTERIORES CONCLUÍDOS (SOMENTE UM CARD POR MÊS COM DESTAQUE) */}
            {pastMonthsList.length > 0 && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-amber-500/20 text-amber-300">
                      <Archive className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Meses Anteriores Concluídos ({pastMonthsList.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-amber-400/80 font-medium">
                    Consolidados por Mês
                  </span>
                </div>

                <div className="flex flex-col gap-3.5">
                  {pastMonthsList.map((pastMonth) => {
                    const isOpen = !!expandedPastMonths[pastMonth.monthKey];

                    return (
                      <div
                        key={pastMonth.monthKey}
                        className={`rounded-2xl transition-all duration-300 overflow-hidden relative ${
                          isOpen
                            ? 'bg-gradient-to-br from-[#1C1828] via-[#141525] to-[#1F172C] border-2 border-amber-400/90 shadow-[0_12px_45px_rgba(245,158,11,0.28)] ring-2 ring-amber-400/30'
                            : 'bg-gradient-to-br from-[#171827] via-[#131422] to-[#1A1626] border-2 border-amber-400/60 hover:border-amber-300 shadow-[0_8px_30px_rgba(245,158,11,0.18)] ring-1 ring-amber-400/20 hover:scale-[1.01]'
                        }`}
                      >
                        {/* Radiant Neon Accent Beam on Top */}
                        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.6)]" />

                        {/* Ambient Glows */}
                        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/12 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-28 h-28 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />

                        {/* Card Header: Clickable trigger */}
                        <div
                          onClick={() => togglePastMonthExpansion(pastMonth.monthKey)}
                          className="p-4 cursor-pointer select-none flex flex-col gap-3 relative z-10"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400/30 to-yellow-500/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
                                <CalendarCheck2 className="w-6 h-6" />
                              </div>

                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-200 border border-amber-400/40 flex items-center gap-1 shadow-xs">
                                    <Sparkles className="w-3 h-3 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
                                    Mês Fechado
                                  </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5 truncate drop-shadow-sm">
                                  {pastMonth.monthLabel}
                                </h3>
                              </div>
                            </div>

                            {/* Right: Value & Chevron */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-xs text-amber-200/90 font-semibold block uppercase tracking-wider">
                                  Total do Mês
                                </span>
                                <span className="text-base sm:text-lg font-black text-amber-300 drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)]">
                                  {driverProfile.privacyHideFinancials
                                    ? 'R$ •••'
                                    : `R$ ${pastMonth.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                </span>
                              </div>

                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                                  isOpen
                                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] rotate-180'
                                    : 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
                                }`}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* Quick summary stats chips */}
                          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                            <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-amber-400/30 text-amber-200 font-bold flex items-center gap-1.5 shadow-xs">
                              <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                              <span>{pastMonth.totalCount} {pastMonth.totalCount === 1 ? 'despesa' : 'despesas'}</span>
                            </div>

                            <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-emerald-400/30 text-emerald-300 font-bold flex items-center gap-1.5 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{pastMonth.paidCount} pagas</span>
                            </div>

                            {pastMonth.fuelLiters > 0 && (
                              <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-amber-400/30 text-amber-300 font-bold flex items-center gap-1.5 shadow-xs">
                                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                                <span>{pastMonth.fuelLiters.toFixed(1)} L</span>
                              </div>
                            )}

                            <span className="text-[11px] text-amber-300/80 font-medium ml-auto flex items-center gap-1">
                              {isOpen ? 'Clique para recolher mês' : 'Clique para ver despesas deste mês'}
                            </span>
                          </div>
                        </div>

                        {/* Accordion Content: List of expense miniature cards */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.28, ease: 'easeInOut' }}
                              className="border-t-2 border-amber-400/40 bg-black/50 p-3 sm:p-4 flex flex-col gap-2.5 relative z-10"
                            >
                              <div className="flex items-center justify-between pb-1 text-xs text-amber-300/90 font-medium">
                                <span>Lançamentos detalhados de {pastMonth.monthLabel}:</span>
                                <span className="text-[11px] text-slate-400">
                                  {pastMonth.expenses.length} itens registrados
                                </span>
                              </div>

                              {pastMonth.expenses.map((item) => (
                                <ExpenseCard
                                  key={item.id}
                                  expense={item}
                                  privacyHideFinancials={driverProfile.privacyHideFinancials}
                                  isExpanded={!!expandedExpenseIds[item.id]}
                                  onToggleExpand={() => toggleExpenseExpansion(item.id)}
                                  onEdit={handleOpenEdit}
                                  onDelete={(exp) => setExpenseToDelete(exp)}
                                  calculateKmL={calculateKmL}
                                  getCategoryIcon={getCategoryIcon}
                                  vehicleModel={vehicles.find((v) => v.plate === item.vehiclePlate)?.model}
                                  vehicleImg={vehicles.find((v) => v.plate === item.vehiclePlate)?.image}
                                />
                              ))}

                              <div className="pt-2 flex justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePastMonthExpansion(pastMonth.monthKey);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  Recolher Mês de {pastMonth.monthLabel}
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
      </section>

      {/* Add / Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingExpense ? 'Editar Despesa' : 'Registrar Despesa'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  Descrição da Despesa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Abastecimento Diesel S10"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value as ExpenseCategory;
                    setCategory(newCat);
                    if ((newCat.toLowerCase() === 'manutencao' || newCat.toLowerCase() === 'manutenção') && !currentVehicleKm) {
                      const v = vehicles.find((veh) => veh.plate === vehiclePlate);
                      if (v && v.kmCurrent) {
                        setCurrentVehicleKm(v.kmCurrent.toString());
                      }
                    }
                  }}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.key} className="bg-[#12141C]">
                      {cat.name}
                    </option>
                  ))}
                  {!categories.some((c) => c.key === category || c.name.toLowerCase() === category.toLowerCase()) && category && (
                    <option value={category} className="bg-[#12141C]">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  )}
                </select>
              </div>

              {/* Se for Manutenção: Abre opções para escolher entre Troca de Peças ou Troca de Óleo */}
              {(category.toLowerCase() === 'manutencao' || category.toLowerCase() === 'manutenção') && (
                <div className="p-3.5 bg-[#1E2129] rounded-2xl border border-indigo-500/30 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Wrench className="w-4 h-4 text-indigo-400" />
                    <span>Tipo de Manutenção</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">
                      Selecione o Serviço Realizado
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMaintenanceType('troca_pecas')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          maintenanceType === 'troca_pecas'
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md ring-2 ring-indigo-500/40'
                            : 'bg-[#12141C] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                        }`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Troca de Peças
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMaintenanceType('troca_oleo');
                          if (!currentVehicleKm) {
                            const v = vehicles.find((veh) => veh.plate === vehiclePlate);
                            if (v && v.kmCurrent) {
                              setCurrentVehicleKm(v.kmCurrent.toString());
                            }
                          }
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          maintenanceType === 'troca_oleo'
                            ? 'bg-amber-600 border-amber-400 text-white shadow-md ring-2 ring-amber-500/40'
                            : 'bg-[#12141C] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                        }`}
                      >
                        <Droplets className="w-3.5 h-3.5 text-amber-300" />
                        Troca de Óleo
                      </button>
                    </div>
                  </div>

                  {/* Se for Troca de Óleo: campo para digitar a quilometragem atual do veículo */}
                  {maintenanceType === 'troca_oleo' && (
                    <div className="p-3 bg-[#12141C] rounded-xl border border-amber-500/30 flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                        <Gauge className="w-3.5 h-3.5 text-amber-400" />
                        Quilometragem Atual do Veículo (KM)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          placeholder="Ex: 145000"
                          value={currentVehicleKm}
                          onChange={(e) => setCurrentVehicleKm(e.target.value)}
                          className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#181B24] text-sm font-mono font-bold text-amber-300 border border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                          KM
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Insira a quilometragem atual do veículo no momento da troca de óleo.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Valor Total (R$)</label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-bold text-rose-400 focus:outline-none"
                />
              </div>

              {/* Special Fuel Section for Combustível */}
              {category === 'combustivel' && (
                <div className="p-3.5 bg-[#1E2129] rounded-2xl border border-indigo-500/30 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Fuel className="w-4 h-4 text-rose-400" />
                    <span>Cálculo de Consumo (km/L)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">
                        Preço por Litro (R$)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 5,80"
                        value={fuelPricePerLiter}
                        onChange={(e) => handlePricePerLiterChange(e.target.value)}
                        className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold focus:outline-none text-white border border-white/10"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">
                        Litros (L)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 50,00"
                        value={fuelLiters}
                        onChange={(e) => handleLitersChange(e.target.value)}
                        className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold focus:outline-none text-white border border-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-indigo-300 mb-1 block uppercase">
                        KM Rodados (Percorridos)
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 400"
                        value={kmDriven}
                        onChange={(e) => setKmDriven(e.target.value)}
                        className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold focus:outline-none text-white border border-indigo-500/30"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">
                        Odômetro
                        <span className="block text-[9px] text-slate-400 font-semibold">(KM ATUAL)</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 145890"
                        value={kmAtRefuel}
                        onChange={(e) => setKmAtRefuel(e.target.value)}
                        className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#12141C] text-xs font-semibold focus:outline-none text-white border border-white/10"
                      />
                    </div>
                  </div>

                  {/* Auto-filled notification badge */}
                  {(kmAtRefuel || kmDriven) && !editingExpense && (() => {
                    const info = getLastJobInfo(vehiclePlate, date);
                    return (
                      <div className="bg-sky-500/10 border border-sky-500/20 p-2 rounded-xl text-[10px] text-sky-300 font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>
                          {vehiclePlate}: <strong>Odômetro {kmAtRefuel} km (KM final do dia anterior)</strong>
                          {kmDriven ? (
                            <> | <strong>KM Rodados: {kmDriven} km</strong></>
                          ) : null}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Live km/L calculation preview */}
                  {(() => {
                    const l = parseFloat(fuelLiters.replace(',', '.'));
                    const km = parseFloat(kmDriven.replace(',', '.'));
                    if (!isNaN(l) && l > 0 && !isNaN(km) && km > 0) {
                      const kmL = (km / l).toFixed(2);
                      return (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-400 font-bold flex items-center justify-between">
                          <span>⚡ Consumo Calculado:</span>
                          <span className="text-sm bg-emerald-500/20 px-2 py-0.5 rounded-lg">
                            {kmL} km/L ({km} ÷ {l})
                          </span>
                        </div>
                      );
                    }
                    if (!isNaN(l) && l > 0) {
                      return (
                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-xl text-[11px] text-indigo-300 font-medium flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            <strong>{l.toFixed(2)} L</strong> informados. Digite os KM Rodados acima para ver o consumo em km/L.
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Veículo</label>
                <select
                  value={vehiclePlate}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.plate} className="bg-[#12141C]">
                      {v.model} ({v.plate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Pago' | 'Pendente')}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white"
                >
                  <option value="Pago" className="bg-[#12141C]">Pago</option>
                  <option value="Pendente" className="bg-[#12141C]">Pendente</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Notas adicionais sobre o comprovante ou motivo"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white resize-none"
                />
              </div>

              <div className="flex gap-2 mt-2">
                {editingExpense && (
                  <button
                    type="button"
                    onClick={() => {
                      const exp = editingExpense;
                      setShowModal(false);
                      setExpenseToDelete(exp);
                    }}
                    className="py-3 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    title="Excluir Despesa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#1E2129] text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                >
                  {editingExpense ? 'Salvar Alterações' : 'Salvar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Expense Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Excluir Despesa?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tem certeza que deseja excluir a despesa <strong className="text-white">"{expenseToDelete.title}"</strong> no valor de <strong className="text-rose-400">R$ {expenseToDelete.amount.toFixed(2)}</strong>?
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-[#1E2129] text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

