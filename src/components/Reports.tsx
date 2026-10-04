import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useFleet } from '../context/FleetContext';
import { Job } from '../types';
import { JobCard } from './JobCard';
import {
  FileText,
  TrendingUp,
  Eye,
  EyeOff,
  Printer,
  X,
  ArrowRight,
  Download,
  Loader2,
  QrCode,
  Archive,
  CalendarCheck2,
  Sparkles,
  FolderArchive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  LayoutGrid,
  Table as TableIcon,
  Truck,
  Gauge,
  Calendar,
  Fuel,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const formatMonthYearBR = (yearMonth: string | any) => {
  if (!yearMonth || typeof yearMonth !== 'string') return '';
  try {
    const [year, month] = yearMonth.split('-').map(Number);
    if (!year || !month) return yearMonth;
    const date = new Date(year, month - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${capitalized} de ${year}`;
  } catch {
    return String(yearMonth || '');
  }
};

interface ReportsProps {
  onSelectJob?: (job: Job) => void;
}

export const Reports: React.FC<ReportsProps> = ({ onSelectJob }) => {
  const { jobs, expenses, vehicles, driverProfile, togglePrivacy, setActiveTab } = useFleet();

  // Filters
  const [period, setPeriod] = useState('Outubro 2023');
  const [clientFilter, setClientFilter] = useState('Todos Clientes');
  const [vehicleFilter, setVehicleFilter] = useState('Todos');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('Todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Controlled expansion states
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({});
  const [showMonthlyFuelAvg, setShowMonthlyFuelAvg] = useState(false);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [pdfSelectedMonth, setPdfSelectedMonth] = useState<string>('');

  // Section options for PDF export
  const [pdfIncludeTripsCount, setPdfIncludeTripsCount] = useState(true);
  const [pdfIncludeKmTotal, setPdfIncludeKmTotal] = useState(true);
  const [pdfIncludeCombustivel, setPdfIncludeCombustivel] = useState(true);
  const [pdfIncludeFaturamento, setPdfIncludeFaturamento] = useState(true);
  const [pdfIncludePix, setPdfIncludePix] = useState(true);
  const [pdfIncludeCnpj, setPdfIncludeCnpj] = useState(true);
  const [pdfIncludeTable, setPdfIncludeTable] = useState(true);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (clientFilter !== 'Todos Clientes' && j.clientName !== clientFilter) return false;
      if (vehicleFilter !== 'Todos' && !j.vehicleModel.includes(vehicleFilter)) return false;
      if (serviceTypeFilter !== 'Todos' && j.serviceType !== serviceTypeFilter) return false;
      return true;
    });
  }, [jobs, clientFilter, vehicleFilter, serviceTypeFilter]);

  // Current YYYY-MM
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  // Lista de todos os meses disponíveis com base nas viagens e despesas
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentYearMonth);

    jobs.forEach((j) => {
      const m = (j.startDate || j.endDate || '').substring(0, 7);
      if (m && m.length === 7) set.add(m);
    });

    expenses.forEach((e) => {
      const m = (e.date || '').substring(0, 7);
      if (m && m.length === 7) set.add(m);
    });

    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [jobs, expenses, currentYearMonth]);

  // Group jobs into:
  // 1. Current Month (Mês Atual)
  // 2. Past Months (Meses Anteriores Encerrados)
  const { currentMonthJobs, pastMonthsList } = useMemo(() => {
    const current: Job[] = [];
    const pastMap: Record<string, Job[]> = {};

    filteredJobs.forEach((job) => {
      const jobMonth = (job.startDate || job.endDate || '').substring(0, 7);
      if (!jobMonth || jobMonth === currentYearMonth || jobMonth >= currentYearMonth) {
        current.push(job);
      } else {
        if (!pastMap[jobMonth]) {
          pastMap[jobMonth] = [];
        }
        pastMap[jobMonth].push(job);
      }
    });

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

  // Controlled expansion state for past months
  const [expandedPastMonths, setExpandedPastMonths] = useState<Record<string, boolean>>({});

  const togglePastMonthExpansion = (monthKey: string) => {
    setExpandedPastMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const toggleJobExpansion = (id: string) => {
    setExpandedJobIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const areAllJobsExpanded = useMemo(() => {
    if (currentMonthJobs.length === 0) return false;
    return currentMonthJobs.every((j) => expandedJobIds[j.id]);
  }, [currentMonthJobs, expandedJobIds]);

  const toggleAllJobs = () => {
    if (areAllJobsExpanded) {
      setExpandedJobIds({});
    } else {
      const next: Record<string, boolean> = {};
      currentMonthJobs.forEach((j) => {
        next[j.id] = true;
      });
      setExpandedJobIds(next);
    }
  };

  // Mês efetivo selecionado para o PDF (padrão: mês atual se não definido)
  const activePdfMonth = typeof pdfSelectedMonth === 'string' && pdfSelectedMonth ? pdfSelectedMonth : currentYearMonth;

  // Viagens filtradas pelo mês selecionado para o PDF
  const pdfJobsForMonth = useMemo(() => {
    return filteredJobs.filter((job) => {
      if (activePdfMonth === 'all') return true;
      const jobMonth = (job.startDate || job.endDate || '').substring(0, 7);
      if (activePdfMonth === currentYearMonth) {
        return !jobMonth || jobMonth === currentYearMonth;
      }
      return jobMonth === activePdfMonth;
    });
  }, [filteredJobs, activePdfMonth, currentYearMonth]);

  // Combustível do mês selecionado para o PDF
  const pdfFuelExpensesForMonth = useMemo(() => {
    return expenses
      .filter((e) => {
        if (e.category !== 'combustivel') return false;
        if (vehicleFilter !== 'Todos') {
          const matchingVehicle = vehicles.find((v) =>
            v.model.toLowerCase().includes(vehicleFilter.toLowerCase()) ||
            v.plate.toLowerCase().includes(vehicleFilter.toLowerCase())
          );
          if (matchingVehicle && e.vehiclePlate && e.vehiclePlate !== matchingVehicle.plate) {
            return false;
          }
        }
        if (activePdfMonth === 'all') return true;
        const expMonth = (e.date || '').substring(0, 7);
        if (activePdfMonth === currentYearMonth) {
          return !expMonth || expMonth === currentYearMonth;
        }
        return expMonth === activePdfMonth;
      })
      .reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [expenses, vehicleFilter, vehicles, activePdfMonth, currentYearMonth]);

  // Rótulo descritivo do período do PDF
  const pdfPeriodLabel = useMemo(() => {
    if (activePdfMonth === 'all') return 'Consolidado Geral (Todos os Meses)';
    if (activePdfMonth === currentYearMonth) return `${formatMonthYearBR(currentYearMonth)} (Mês Atual)`;
    return formatMonthYearBR(activePdfMonth);
  }, [activePdfMonth, currentYearMonth]);

  const selectedJobs = useMemo(() => {
    return pdfJobsForMonth.filter((j) => selectedJobIds.includes(j.id));
  }, [pdfJobsForMonth, selectedJobIds]);

  const pdfTotalTrips = selectedJobs.length;
  const pdfTotalKm = selectedJobs.reduce((acc, j) => acc + (j.kmTotal || 0), 0);
  const pdfTotalRevenue = selectedJobs.reduce((acc, j) => acc + j.amount, 0);

  const handleSelectMonthForPdf = (monthKey: string) => {
    const validKey = typeof monthKey === 'string' ? monthKey : currentYearMonth;
    setPdfSelectedMonth(validKey);
    const jobsInMonth = filteredJobs.filter((job) => {
      if (validKey === 'all') return true;
      const jobMonth = (job.startDate || job.endDate || '').substring(0, 7);
      if (validKey === currentYearMonth) {
        return !jobMonth || jobMonth === currentYearMonth;
      }
      return jobMonth === validKey;
    });
    setSelectedJobIds(jobsInMonth.map((j) => j.id));
  };

  const handleOpenPdfModal = (targetMonth?: unknown) => {
    const month =
      typeof targetMonth === 'string' && targetMonth.trim()
        ? targetMonth
        : (typeof pdfSelectedMonth === 'string' && pdfSelectedMonth ? pdfSelectedMonth : currentYearMonth);

    setPdfSelectedMonth(month);
    const jobsInMonth = filteredJobs.filter((job) => {
      if (month === 'all') return true;
      const jobMonth = (job.startDate || job.endDate || '').substring(0, 7);
      if (month === currentYearMonth) {
        return !jobMonth || jobMonth === currentYearMonth;
      }
      return jobMonth === month;
    });
    setSelectedJobIds(jobsInMonth.map((j) => j.id));
    setPdfIncludeTripsCount(true);
    setPdfIncludeKmTotal(true);
    setPdfIncludeCombustivel(true);
    setPdfIncludeFaturamento(true);
    setPdfIncludePix(!!driverProfile.pixKey);
    setPdfIncludeCnpj(!!driverProfile.cnpj);
    setPdfIncludeTable(true);
    setShowPdfModal(true);
  };

  const toggleSelectAll = () => {
    if (selectedJobIds.length === pdfJobsForMonth.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(pdfJobsForMonth.map((j) => j.id));
    }
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleDownloadPdf = async () => {
    if (pdfIncludeTable && pdfJobsForMonth.length > 0 && selectedJobs.length === 0) {
      alert('Selecione pelo menos um item da tabela para exportar o relatório PDF.');
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header Title & Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('Rota Fácil', 14, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('Relatório Operacional de Frota', 14, 26);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(`Motorista: ${driverProfile.name} (ID: ${driverProfile.fleetId})`, 14, 32);

      let currentY = 32;
      if (pdfIncludeCnpj && driverProfile.cnpj) {
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`CNPJ / CPF: ${driverProfile.cnpj}`, 14, currentY);
      }

      // Right Header Info (Period & Generation Date)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text(pdfPeriodLabel, 196, 20, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 196, 26, { align: 'right' });

      currentY += 6;
      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, currentY, 196, currentY);

      currentY += 6;

      // PIX Box
      if (pdfIncludePix && driverProfile.pixKey) {
        doc.setFillColor(240, 253, 244); // bg-emerald-50
        doc.setDrawColor(187, 247, 208); // border-emerald-200
        doc.roundedRect(14, currentY, 182, 18, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(22, 101, 52); // emerald-800
        doc.text('DADOS PARA PAGAMENTO (CHAVE PIX)', 18, currentY + 5);

        doc.setFont('courier', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(21, 128, 61); // emerald-700
        doc.text(driverProfile.pixKey, 18, currentY + 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(22, 101, 52);
        doc.text(`Favorecido: ${driverProfile.name}`, 18, currentY + 15);

        currentY += 23;
      }

      // Summary Stats Cards
      const stats = [
        pdfIncludeTripsCount && { label: 'VIAGENS', val: String(pdfTotalTrips), color: [15, 23, 42] },
        pdfIncludeKmTotal && { label: 'KM TOTAL', val: `${pdfTotalKm.toLocaleString('pt-BR')} km`, color: [15, 23, 42] },
        pdfIncludeCombustivel && { label: 'COMBUSTÍVEL', val: `R$ ${pdfFuelExpensesForMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: [225, 29, 72] },
        pdfIncludeFaturamento && { label: 'FATURAMENTO', val: `R$ ${pdfTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: [21, 128, 61] },
      ].filter(Boolean) as { label: string; val: string; color: [number, number, number] }[];

      if (stats.length > 0) {
        const cardWidth = 182 / stats.length;
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, currentY, 182, 16, 2, 2, 'FD');

        stats.forEach((st, i) => {
          const x = 14 + i * cardWidth + cardWidth / 2;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(st.label, x, currentY + 5, { align: 'center' });

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(st.color[0], st.color[1], st.color[2]);
          doc.text(st.val, x, currentY + 12, { align: 'center' });
        });

        currentY += 22;
      }

      // Table of Jobs
      if (pdfIncludeTable && selectedJobs.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Código', 'Cliente', 'KM', { content: 'Valor', styles: { halign: 'right' } }]],
          body: selectedJobs.map((j) => [
            j.code,
            j.clientName,
            `${j.kmTotal} km`,
            `R$ ${j.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          ]),
          theme: 'striped',
          headStyles: {
            fillColor: [30, 41, 59], // slate-800
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [15, 23, 42],
          },
          columnStyles: {
            0: { font: 'courier', cellWidth: 35 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 30 },
            3: { halign: 'right', fontStyle: 'bold', textColor: [79, 70, 229] },
          },
          margin: { left: 14, right: 14 },
        });

        // @ts-ignore
        if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
          // @ts-ignore
          currentY = doc.lastAutoTable.finalY + 12;
        } else {
          currentY += 40;
        }
      }

      // Footer line & signature
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, currentY, 196, currentY);

      currentY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Assinatura do Responsável: ___________________________', 14, currentY);
      doc.text('Rota Fácil Document #PDF-8829', 196, currentY, { align: 'right' });

      // Save PDF directly with chosen month in filename
      const safePeriod = pdfPeriodLabel.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Relatorio_Rota_Facil_${safePeriod}.pdf`);
    } catch (err) {
      console.error('Error generating PDF with jsPDF:', err);
      alert('Ocorreu um erro ao gerar o arquivo PDF. Tentando modo de impressão.');
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (pdfIncludeTable && pdfJobsForMonth.length > 0 && selectedJobs.length === 0) {
      alert('Selecione pelo menos um item para imprimir.');
      return;
    }

    try {
      const statsHtml = [];
      if (pdfIncludeTripsCount) {
        statsHtml.push(`<div><div class="stat-label">Viagens</div><div class="stat-val">${pdfTotalTrips}</div></div>`);
      }
      if (pdfIncludeKmTotal) {
        statsHtml.push(`<div><div class="stat-label">KM Total</div><div class="stat-val">${pdfTotalKm} km</div></div>`);
      }
      if (pdfIncludeCombustivel) {
        statsHtml.push(`<div><div class="stat-label">Combustível</div><div class="stat-val" style="color: #e11d48;">R$ ${pdfFuelExpensesForMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div></div>`);
      }
      if (pdfIncludeFaturamento) {
        statsHtml.push(`<div><div class="stat-label">Faturamento</div><div class="stat-val" style="color: #15803d;">R$ ${pdfTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>`);
      }

      const gridColsCss = statsHtml.length > 0 ? `grid-template-columns: repeat(${statsHtml.length}, 1fr);` : 'display: none;';

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Relatório Rota Fácil - ${pdfPeriodLabel}</title>
              <style>
                body {
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background-color: #ffffff;
                  color: #0f172a;
                  padding: 24px;
                  margin: 0;
                }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
                .title { font-size: 20px; font-weight: bold; color: #0f172a; }
                .subtitle { font-size: 12px; color: #64748b; }
                .pix-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin-bottom: 16px; color: #166534; font-size: 12px; }
                .pix-key { font-family: monospace; font-weight: bold; font-size: 13px; color: #15803d; margin-top: 2px; }
                .grid-stats { display: grid; ${gridColsCss} gap: 8px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px; text-align: center; }
                .stat-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
                .stat-val { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 2px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
                th { background: #f1f5f9; text-align: left; padding: 8px; font-weight: bold; color: #475569; border-bottom: 1px solid #cbd5e1; }
                td { padding: 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
                .text-right { text-align: right; }
                .footer { margin-top: 32px; pt: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="title">Rota Fácil</div>
                  <div class="subtitle">Relatório Operacional de Frota</div>
                  <div class="subtitle" style="margin-top: 4px; font-weight: 600; color: #334155;">
                    Motorista: ${driverProfile.name} (ID: ${driverProfile.fleetId})
                  </div>
                  ${pdfIncludeCnpj && driverProfile.cnpj ? `
                    <div class="subtitle" style="font-weight: 600; color: #475569; margin-top: 2px;">
                      CNPJ / CPF: ${driverProfile.cnpj}
                    </div>
                  ` : ''}
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: bold; color: #4f46e5;">${pdfPeriodLabel}</div>
                  <div class="subtitle">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
                </div>
              </div>

              ${pdfIncludePix && driverProfile.pixKey ? `
                <div class="pix-box">
                  <div style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #166534;">Dados para Pagamento (Chave PIX)</div>
                  <div class="pix-key">${driverProfile.pixKey}</div>
                  <div style="font-size: 11px; margin-top: 2px;">Favorecido: ${driverProfile.name}</div>
                </div>
              ` : ''}

              ${statsHtml.length > 0 ? `
                <div class="grid-stats">
                  ${statsHtml.join('')}
                </div>
              ` : ''}

              ${pdfIncludeTable && selectedJobs.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>KM</th>
                      <th class="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${selectedJobs.map(j => `
                      <tr>
                        <td style="font-family: monospace;">${j.code}</td>
                        <td>${j.clientName}</td>
                        <td>${j.kmTotal} km</td>
                        <td class="text-right" style="font-weight: bold;">R$ ${j.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}

              <div class="footer">
                <span>Assinatura do Responsável: ___________________________</span>
                <span>Rota Fácil Document #PDF-8829</span>
              </div>

              <script>
                window.onload = function() {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    } catch (e) {
      console.error('Print window error:', e);
    }

    window.print();
  };

  // Calculate metrics for the current month
  const totalTrips = currentMonthJobs.length;
  const totalKm = currentMonthJobs.reduce((acc, j) => acc + (j.kmTotal || 0), 0);
  const totalRevenue = currentMonthJobs.reduce((acc, j) => acc + j.amount, 0);
  const avgPerJob = totalTrips > 0 ? Math.round(totalRevenue / totalTrips) : 0;

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (vehicleFilter !== 'Todos') {
        const matchingVehicle = vehicles.find((v) =>
          v.model.toLowerCase().includes(vehicleFilter.toLowerCase()) ||
          v.plate.toLowerCase().includes(vehicleFilter.toLowerCase())
        );
        if (matchingVehicle && e.vehiclePlate && e.vehiclePlate !== matchingVehicle.plate) {
          return false;
        }
      }
      const expMonth = (e.date || '').substring(0, 7);
      return !expMonth || expMonth === currentYearMonth || expMonth >= currentYearMonth;
    });
  }, [expenses, currentYearMonth, vehicleFilter, vehicles]);

  const fuelExpenses = currentMonthExpenses
    .filter((e) => e.category === 'combustivel')
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  // 1. Função de cálculo da média do último abastecimento (km/l)
  const latestRefuelConsumption = useMemo(() => {
    // Filtrar despesas de combustível (respeitando o filtro de veículo se selecionado)
    const fuelExpenses = expenses.filter((e) => {
      if (e.category !== 'combustivel') return false;
      if (vehicleFilter !== 'Todos') {
        const matchingVehicle = vehicles.find((v) =>
          v.model.toLowerCase().includes(vehicleFilter.toLowerCase()) ||
          v.plate.toLowerCase().includes(vehicleFilter.toLowerCase())
        );
        if (matchingVehicle && e.vehiclePlate && e.vehiclePlate !== matchingVehicle.plate) {
          return false;
        }
      }
      return true;
    });

    if (fuelExpenses.length === 0) {
      return {
        value: 0,
        formatted: '-- km/l',
        detail: '',
        hasData: false,
      };
    }

    // Ordena do mais recente para o mais antigo por data e hora
    const sorted = [...fuelExpenses].sort((a, b) => {
      const timeA = new Date(`${a.date || ''}T${a.time || '00:00'}`).getTime() || 0;
      const timeB = new Date(`${b.date || ''}T${b.time || '00:00'}`).getTime() || 0;
      return timeB - timeA;
    });

    const latest = sorted[0];
    if (!latest) {
      return { value: 0, formatted: '-- km/l', detail: '', hasData: false };
    }

    // Litros do último abastecimento
    const liters =
      typeof latest.fuelLiters === 'number' && latest.fuelLiters > 0
        ? latest.fuelLiters
        : latest.amount > 0 && typeof latest.fuelPricePerLiter === 'number' && latest.fuelPricePerLiter > 0
        ? latest.amount / latest.fuelPricePerLiter
        : 0;

    if (liters <= 0) {
      return { value: 0, formatted: '-- km/l', detail: '', hasData: false };
    }

    // Quilometragem percorrida referente a este último abastecimento
    let kmDriven = 0;

    // Prioridade 1: KM Rodados já informado diretamente no registro do abastecimento
    if (typeof latest.kmDriven === 'number' && latest.kmDriven > 0) {
      kmDriven = latest.kmDriven;
    }
    // Prioridade 2: Odômetro informado - calcula a diferença em relação ao abastecimento anterior do mesmo veículo
    else if (typeof latest.kmAtRefuel === 'number' && latest.kmAtRefuel > 0) {
      const sameVehicleRefuels = sorted.filter(
        (e) => e.vehiclePlate === latest.vehiclePlate && typeof e.kmAtRefuel === 'number' && e.kmAtRefuel > 0
      );
      const prev = sameVehicleRefuels.find(
        (e) => e.id !== latest.id && (e.kmAtRefuel || 0) < (latest.kmAtRefuel || 0)
      );
      if (prev && prev.kmAtRefuel && latest.kmAtRefuel > prev.kmAtRefuel) {
        kmDriven = latest.kmAtRefuel - prev.kmAtRefuel;
      }
    }

    // Prioridade 3: Soma dos KMs dos trabalhos/jobs do veículo entre o abastecimento anterior e o último
    if (kmDriven <= 0) {
      const targetPlate = latest.vehiclePlate;
      const vehicleJobs = jobs.filter((j) => !targetPlate || j.vehiclePlate === targetPlate);
      const prevRefuel = sorted.find((e) => e.id !== latest.id && (!targetPlate || e.vehiclePlate === targetPlate));

      if (prevRefuel) {
        const prevTime = new Date(`${prevRefuel.date}T${prevRefuel.time || '00:00'}`).getTime() || 0;
        const currTime = new Date(`${latest.date}T${latest.time || '23:59'}`).getTime() || 0;
        const jobsBetween = vehicleJobs.filter((j) => {
          const jTime = new Date(`${j.endDate || j.startDate}T${j.endTime || j.startTime || '00:00'}`).getTime() || 0;
          return jTime >= prevTime && jTime <= currTime;
        });
        const sumKm = jobsBetween.reduce((acc, j) => acc + (j.kmTotal || 0), 0);
        if (sumKm > 0) {
          kmDriven = sumKm;
        }
      }
    }

    // Prioridade 4: Se ainda não tiver km específico, usa totalKm do mês se houver
    if (kmDriven <= 0 && totalKm > 0) {
      kmDriven = totalKm;
    }

    if (kmDriven > 0 && liters > 0) {
      const kmPerLiter = kmDriven / liters;
      return {
        value: kmPerLiter,
        formatted: `${kmPerLiter.toLocaleString('pt-BR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} km/l`,
        kmDriven,
        liters,
        detail: `${kmDriven.toLocaleString('pt-BR')} km / ${liters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`,
        hasData: true,
      };
    }

    return {
      value: 0,
      formatted: '-- km/l',
      detail: '',
      hasData: false,
    };
  }, [expenses, jobs, vehicleFilter, vehicles, totalKm]);

  // 2. Média de Abastecimentos do Mês Inteiro (Consolidado: soma todos os abastecimentos do mês e divide pelos KM rodados)
  const monthlyFuelAverage = useMemo(() => {
    // Despesas de combustível do mês atual (respeitando o filtro de veículo se ativo)
    const monthFuelExpenses = currentMonthExpenses.filter((e) => e.category === 'combustivel');

    const totalLiters = monthFuelExpenses.reduce((acc, e) => {
      if (typeof e.fuelLiters === 'number' && e.fuelLiters > 0) {
        return acc + e.fuelLiters;
      }
      if (e.amount > 0 && typeof e.fuelPricePerLiter === 'number' && e.fuelPricePerLiter > 0) {
        return acc + (e.amount / e.fuelPricePerLiter);
      }
      return acc;
    }, 0);

    const totalFuelAmount = monthFuelExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    // Soma de kmDriven informados nas despesas de combustível
    const fuelKmDriven = monthFuelExpenses.reduce((acc, e) => acc + (e.kmDriven || 0), 0);

    // Quilometragem total do mês (viagens ou despesas)
    const distanceKm = totalKm > 0 ? totalKm : fuelKmDriven;

    const refuelCount = monthFuelExpenses.length;

    if (totalLiters > 0 && distanceKm > 0) {
      const kmPerLiter = distanceKm / totalLiters;
      return {
        value: kmPerLiter,
        formatted: `${kmPerLiter.toLocaleString('pt-BR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} km/l`,
        totalLiters,
        distanceKm,
        totalFuelAmount,
        refuelCount,
        hasData: true,
      };
    }

    return {
      value: 0,
      formatted: '-- km/l',
      totalLiters,
      distanceKm,
      totalFuelAmount,
      refuelCount,
      hasData: false,
    };
  }, [currentMonthExpenses, totalKm]);

  const displayRevenue = driverProfile.privacyHideFinancials
    ? 'R$ ••••••'
    : `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="pt-18 pb-28 px-5 max-w-2xl mx-auto flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Relatórios Mensais</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Visão detalhada do faturamento e viagens do mês atual.
        </p>
      </div>

      {/* Summary 3D Card */}
      <section className="depth-card rounded-3xl p-6 relative overflow-hidden group border border-white/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <FileText className="w-24 h-24 text-indigo-400" />
        </div>

        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              RESUMO DE {formatMonthYearBR(currentYearMonth).toUpperCase()}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {displayRevenue}
              </span>
              <button
                type="button"
                onClick={togglePrivacy}
                className="p-1.5 bg-[#1E2129] rounded-full hover:bg-slate-700 transition-colors flex items-center justify-center active:scale-90"
              >
                {driverProfile.privacyHideFinancials ? (
                  <Eye className="w-4 h-4 text-indigo-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Mês Atual
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#1E2129] rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] font-bold text-slate-400 mb-0.5">Total Viagens</p>
            <p className="text-lg font-bold text-white">{totalTrips}</p>
          </div>
          <div className="bg-[#1E2129] rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] font-bold text-slate-400 mb-0.5">Total KM</p>
            <p className="text-lg font-bold text-white">{totalKm.toLocaleString('pt-BR')}</p>
          </div>
          {/* Card 3: Média do Último Abastecimento */}
          <div
            onClick={() => setShowMonthlyFuelAvg((prev) => !prev)}
            className="bg-[#1E2129] rounded-2xl p-3 border border-white/5 relative overflow-hidden transition-all duration-200 hover:border-emerald-500/30 group/stat cursor-pointer select-none"
            title="Clique para alternar a visualização da Média Mensal Consolidada"
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <p className="text-[10px] font-bold text-slate-400 truncate" title="Média do Último Abastecimento">
                Média Último Abast.
              </p>
              <Fuel className="w-3.5 h-3.5 text-emerald-400/70 group-hover/stat:text-emerald-400 transition-colors shrink-0" />
            </div>
            <p className={`text-lg font-bold tracking-tight ${latestRefuelConsumption.hasData ? 'text-emerald-400' : 'text-slate-400'}`}>
              {latestRefuelConsumption.formatted}
            </p>
            <span className="text-[9px] text-emerald-400/75 group-hover/stat:text-emerald-300 transition-colors flex items-center gap-0.5 mt-0.5 font-medium">
              {showMonthlyFuelAvg ? 'Ocultar mês' : 'Ver mês'}
              {showMonthlyFuelAvg ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </span>
          </div>
          <div className="bg-[#1E2129] rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] font-bold text-slate-400 mb-0.5">Combustível</p>
            <p className="text-lg font-bold text-rose-400">
              R$ {fuelExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Toggle Bar para a Média do Mês Inteiro */}
        <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMonthlyFuelAvg((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Fuel className="w-3.5 h-3.5" />
            </div>
            <span>
              {showMonthlyFuelAvg ? 'Ocultar Média do Mês Inteiro' : 'Ver Média dos Abastecimentos do Mês Inteiro'}
            </span>
            {showMonthlyFuelAvg ? (
              <ChevronUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            )}
          </button>

          {!showMonthlyFuelAvg && (
            <span className="text-[11px] font-bold text-emerald-400/90 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {monthlyFuelAverage.formatted}
            </span>
          )}
        </div>

        {/* Div escondida / expansível com a Média dos Abastecimentos do Mês Inteiro */}
        <AnimatePresence>
          {showMonthlyFuelAvg && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mt-3 bg-[#12141C] rounded-2xl p-4 border border-emerald-500/25 flex flex-col gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-tight">
                      Média dos Abastecimentos do Mês Inteiro
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Soma de todos os abastecimentos e KM rodados no mês
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Consumo Consolidado
                  </span>
                  <span className={`text-xl sm:text-2xl font-black tracking-tight ${monthlyFuelAverage.hasData ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {monthlyFuelAverage.formatted}
                  </span>
                </div>
              </div>

              {/* Sub-estatísticas detalhadas */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center relative z-10">
                <div className="bg-[#1E2129] rounded-xl p-2.5 border border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Litros</span>
                  <span className="text-xs sm:text-sm font-bold text-white font-mono">
                    {monthlyFuelAverage.totalLiters > 0
                      ? `${monthlyFuelAverage.totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`
                      : '-- L'}
                  </span>
                </div>
                <div className="bg-[#1E2129] rounded-xl p-2.5 border border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">KM Percorridos</span>
                  <span className="text-xs sm:text-sm font-bold text-white font-mono">
                    {monthlyFuelAverage.distanceKm > 0
                      ? `${monthlyFuelAverage.distanceKm.toLocaleString('pt-BR')} km`
                      : '-- km'}
                  </span>
                </div>
                <div className="bg-[#1E2129] rounded-xl p-2.5 border border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Abastecimentos</span>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {monthlyFuelAverage.refuelCount} {monthlyFuelAverage.refuelCount === 1 ? 'registro' : 'registros'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Smart Filters */}
      <section className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 px-1">Período</label>
            <select
              value={pdfSelectedMonth || currentYearMonth}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPdfSelectedMonth(e.target.value);
              }}
              className="inset-input rounded-xl border-none text-xs font-semibold h-11 px-3 bg-[#1E2129] text-white focus:outline-none cursor-pointer"
            >
              <option value={currentYearMonth} className="bg-[#12141C]">
                Mês Atual ({formatMonthYearBR(currentYearMonth)})
              </option>
              {availableMonths
                .filter((m) => m !== currentYearMonth)
                .map((m) => (
                  <option key={m} value={m} className="bg-[#12141C]">
                    {formatMonthYearBR(m)}
                  </option>
                ))}
              <option value="all" className="bg-[#12141C]">
                Todos os Meses (Geral)
              </option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 px-1">Cliente</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="inset-input rounded-xl border-none text-xs font-semibold h-11 px-3 bg-[#1E2129] text-white focus:outline-none cursor-pointer"
            >
              <option value="Todos Clientes" className="bg-[#12141C]">Todos Clientes</option>
              <option value="LogiCorp S.A." className="bg-[#12141C]">LogiCorp S.A.</option>
              <option value="Swift Cargo" className="bg-[#12141C]">Swift Cargo</option>
              <option value="Global Trans" className="bg-[#12141C]">Global Trans</option>
              <option value="Logística Express S.A." className="bg-[#12141C]">Logística Express S.A.</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 px-1">Veículo</label>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="inset-input rounded-xl border-none text-xs font-semibold h-11 px-3 bg-[#1E2129] text-white focus:outline-none cursor-pointer"
            >
              <option value="Todos" className="bg-[#12141C]">Todos Veículos</option>
              <option value="Scania" className="bg-[#12141C]">Scania R450</option>
              <option value="Sprinter" className="bg-[#12141C]">MB Sprinter</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-400 px-1">Tipo Serviço</label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="inset-input rounded-xl border-none text-xs font-semibold h-11 px-3 bg-[#1E2129] text-white focus:outline-none cursor-pointer"
            >
              <option value="Todos" className="bg-[#12141C]">Express / Todos</option>
              <option value="CARGA" className="bg-[#12141C]">Carga Fracionada</option>
              <option value="PESSOAL" className="bg-[#12141C]">Pessoal</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenPdfModal()}
          className="bg-indigo-600 text-white rounded-2xl h-12 px-6 flex items-center justify-center gap-2 glow-button active:scale-95 transition-all w-full font-bold text-sm hover:bg-indigo-500 border border-indigo-400/30 cursor-pointer"
        >
          <FileText className="w-5 h-5" />
          Exportar Relatório PDF
        </button>
      </section>

      {/* Section 3: Somente Mês Atual */}
      <section id="reports-trips-section" className="flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Viagens do Mês Atual
              </h3>
              <span className="text-xs font-semibold text-indigo-400">
                ({formatMonthYearBR(currentYearMonth)})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Exibindo somente as viagens do mês corrente em cards miniatura.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-[#1E2129] border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" /> Tabela
              </button>
            </div>

            {viewMode === 'cards' && currentMonthJobs.length > 0 && (
              <button
                type="button"
                onClick={toggleAllJobs}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
                {areAllJobsExpanded ? 'Recolher Todos' : 'Expandir Todos'}
              </button>
            )}
          </div>
        </div>

        {currentMonthJobs.length === 0 ? (
          <div className="text-center py-10 bg-[#12141C] border border-white/5 rounded-3xl p-6 text-slate-400 flex flex-col items-center">
            <FileText className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-bold text-white">Nenhuma viagem encontrada no mês atual</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Não há registros para o mês de {formatMonthYearBR(currentYearMonth)} com os filtros aplicados.
            </p>
            <button
              type="button"
              onClick={() => {
                setClientFilter('Todos Clientes');
                setVehicleFilter('Todos');
                setServiceTypeFilter('Todos');
              }}
              className="mt-3 px-3.5 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-bold text-xs hover:bg-indigo-600/30 transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="flex flex-col gap-6">
            {/* SEÇÃO 1: MÊS ATUAL */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-semibold text-slate-400">
                  {currentMonthJobs.length} {currentMonthJobs.length === 1 ? 'viagem registrada' : 'viagens registradas'} no mês atual
                </span>
              </div>

              {currentMonthJobs.length === 0 ? (
                <div className="py-6 px-4 bg-[#12141C] rounded-2xl border border-white/5 text-center text-slate-400 text-xs">
                  Nenhuma viagem registrada neste mês atual até o momento.
                </div>
              ) : (
                currentMonthJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    privacyHideFinancials={driverProfile.privacyHideFinancials}
                    isExpanded={!!expandedJobIds[job.id]}
                    onToggleExpand={() => toggleJobExpansion(job.id)}
                    onOpenDetails={() => onSelectJob?.(job)}
                  />
                ))
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
                                  Faturamento
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
                              <span>{pastMonth.jobs.length} {pastMonth.jobs.length === 1 ? 'viagem' : 'viagens'}</span>
                            </div>

                            <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-emerald-400/30 text-emerald-300 font-bold flex items-center gap-1.5 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{pastMonth.completedCount} finalizadas</span>
                            </div>

                            <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-indigo-400/30 text-indigo-300 font-bold flex items-center gap-1.5 shadow-xs font-mono">
                              <span>{pastMonth.totalKm.toLocaleString('pt-BR')} km</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPdfModal(pastMonth.monthKey);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 hover:bg-yellow-300 font-extrabold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer ml-auto"
                              title={`Baixar relatório PDF de ${pastMonth.monthLabel}`}
                            >
                              <FileText className="w-3 h-3" />
                              <span>Baixar PDF</span>
                            </button>

                            <span className="text-[11px] text-amber-300/80 font-medium flex items-center gap-1">
                              {isOpen ? 'Clique para recolher mês' : 'Clique para ver viagens'}
                            </span>
                          </div>
                        </div>

                        {/* Accordion Content: List of job miniature cards */}
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
                                <span>Viagens detalhadas de {pastMonth.monthLabel}:</span>
                                <span className="text-[11px] text-slate-400">
                                  {pastMonth.jobs.length} itens registrados
                                </span>
                              </div>

                              {pastMonth.jobs.map((job) => (
                                <JobCard
                                  key={job.id}
                                  job={job}
                                  privacyHideFinancials={driverProfile.privacyHideFinancials}
                                  isExpanded={!!expandedJobIds[job.id]}
                                  onToggleExpand={() => toggleJobExpansion(job.id)}
                                  onOpenDetails={() => onSelectJob?.(job)}
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
        ) : (
          /* Table View - Somente Mês Atual */
          <div className="depth-card rounded-3xl overflow-hidden shadow-xs border border-white/10 bg-[#12141C]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[340px]">
                <thead>
                  <tr className="bg-[#1E2129] border-b border-white/10">
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">Data</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">Job / ID</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase hidden sm:table-cell">
                      Cliente
                    </th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase">KM</th>
                    <th className="p-3.5 text-[11px] font-bold text-slate-400 uppercase text-right">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentMonthJobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJob?.(job)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 text-xs font-semibold text-slate-300 whitespace-nowrap">
                        {job.startDate ? job.startDate.split('-').slice(1).reverse().join('/') : ''}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white line-clamp-1">
                            {job.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {job.code}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-xs text-slate-300 hidden sm:table-cell">
                        {job.clientName}
                      </td>
                      <td className="p-3.5 text-xs font-medium text-slate-300 whitespace-nowrap">
                        {job.kmTotal} km
                      </td>
                      <td className="p-3.5 text-xs font-bold text-right text-indigo-400 whitespace-nowrap">
                        {driverProfile.privacyHideFinancials
                          ? 'R$ •••'
                          : `R$ ${job.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-[#1E2129] flex justify-center border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className="text-indigo-400 text-xs font-bold hover:underline transition-all flex items-center gap-1 cursor-pointer"
              >
                Ver Todos os Jobs <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* PDF Generator / Export Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Relatório PDF - Rota Fácil
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Selecione os itens que devem ser incluídos no relatório.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seletor do Mês a ser exportado / baixado */}
            <div className="bg-[#1E2129] p-4 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <label htmlFor="pdf-month-selector" className="text-xs font-bold text-white block">
                    Mês para Exportar no PDF
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Selecione o mês que deseja baixar neste relatório
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto min-w-[240px]">
                <select
                  id="pdf-month-selector"
                  value={activePdfMonth}
                  onChange={(e) => handleSelectMonthForPdf(e.target.value)}
                  className="w-full bg-[#12141C] border border-indigo-500/40 hover:border-indigo-400 rounded-xl px-3 py-2.5 text-xs font-bold text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all shadow-inner"
                >
                  <optgroup label="Meses Disponíveis" className="bg-[#12141C] text-slate-300 font-bold">
                    {availableMonths.map((m) => (
                      <option key={m} value={m} className="bg-[#12141C] text-white">
                        {m === currentYearMonth
                          ? `📅 ${formatMonthYearBR(m)} (Mês Atual)`
                          : `🗓️ ${formatMonthYearBR(m)}`}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Outras Opções" className="bg-[#12141C] text-slate-300 font-bold">
                    <option value="all" className="bg-[#12141C] text-white">
                      📊 Todos os Meses (Consolidado Geral)
                    </option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Section Selection Toolbar */}
            <div className="bg-[#1E2129] p-3.5 rounded-2xl border border-white/5 no-print flex flex-col gap-2.5">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-slate-200">
                  Itens / Seções no PDF:
                </span>
                <span className="text-[11px] text-indigo-400 font-semibold">
                  Marque para incluir
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#12141C] border border-white/5 cursor-pointer hover:border-indigo-500/30 select-none">
                  <input
                    type="checkbox"
                    checked={pdfIncludeTripsCount}
                    onChange={(e) => setPdfIncludeTripsCount(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-200 font-medium">Viagens (Qtd)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#12141C] border border-white/5 cursor-pointer hover:border-indigo-500/30 select-none">
                  <input
                    type="checkbox"
                    checked={pdfIncludeKmTotal}
                    onChange={(e) => setPdfIncludeKmTotal(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-200 font-medium">KM Total</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#12141C] border border-white/5 cursor-pointer hover:border-indigo-500/30 select-none">
                  <input
                    type="checkbox"
                    checked={pdfIncludeCombustivel}
                    onChange={(e) => setPdfIncludeCombustivel(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-200 font-medium">Combustível</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#12141C] border border-white/5 cursor-pointer hover:border-indigo-500/30 select-none">
                  <input
                    type="checkbox"
                    checked={pdfIncludeFaturamento}
                    onChange={(e) => setPdfIncludeFaturamento(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-200 font-medium">Faturamento</span>
                </label>

                <label className={`flex items-center gap-2 p-2 rounded-xl bg-[#12141C] border border-white/5 cursor-pointer hover:border-indigo-500/30 select-none ${!driverProfile.pixKey ? 'opacity-40' : ''}`}>
                  <input
                    type="checkbox"
                    disabled={!driverProfile.pixKey}
                    checked={pdfIncludePix && !!driverProfile.pixKey}
                    onChange={(e) => setPdfIncludePix(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-200 font-medium">Chave PIX</span>
                </label>

                <label className={`flex items-center gap-2 p-2 rounded-xl bg-[#12141C] border border-white/5 cursor-pointer hover:border-indigo-500/30 select-none ${!driverProfile.cnpj ? 'opacity-40' : ''}`}>
                  <input
                    type="checkbox"
                    disabled={!driverProfile.cnpj}
                    checked={pdfIncludeCnpj && !!driverProfile.cnpj}
                    onChange={(e) => setPdfIncludeCnpj(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-200 font-medium">CNPJ / CPF</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-[#12141C] border border-white/5 cursor-pointer hover:border-indigo-500/30 select-none col-span-2 sm:col-span-3">
                  <input
                    type="checkbox"
                    checked={pdfIncludeTable}
                    onChange={(e) => setPdfIncludeTable(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-200 font-medium">Tabela de Viagens (Detalhamento)</span>
                </label>
              </div>
            </div>

            {/* Selection toolbar for table items */}
            {pdfIncludeTable && (
              <div className="flex items-center justify-between bg-[#1E2129] px-3.5 py-2.5 rounded-2xl border border-white/5 no-print text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={pdfJobsForMonth.length > 0 && selectedJobIds.length === pdfJobsForMonth.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                  <span>
                    {selectedJobIds.length === pdfJobsForMonth.length ? 'Desmarcar Todas Viagens' : 'Marcar Todas Viagens'}{' '}
                    <span className="text-slate-400 font-normal">
                      ({selectedJobIds.length}/{pdfJobsForMonth.length} selecionadas)
                    </span>
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobIds(pdfJobsForMonth.map((j) => j.id))}
                    className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px] underline"
                  >
                    Marcar Todas
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedJobIds([])}
                    className="text-slate-400 hover:text-slate-200 font-bold text-[11px] underline"
                  >
                    Desmarcar Todas
                  </button>
                </div>
              </div>
            )}

            {/* Printable Content Container */}
            <div id="pdf-report-content" className="flex flex-col gap-4 text-slate-200 p-3 bg-[#12141C] rounded-2xl border border-white/5">
              <div className="flex justify-between items-start border-b border-white/10 pb-3">
                <div>
                  <h1 className="text-xl font-bold text-white">Rota Fácil</h1>
                  <p className="text-xs text-slate-400">Relatório Operacional de Frota</p>
                  <p className="text-xs font-semibold text-slate-300 mt-1">
                    Motorista: {driverProfile.name} (ID: {driverProfile.fleetId})
                  </p>
                  {pdfIncludeCnpj && driverProfile.cnpj && (
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      CNPJ / CPF: {driverProfile.cnpj}
                    </p>
                  )}
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-indigo-400">{pdfPeriodLabel}</p>
                  <p className="text-slate-400 text-[10px]">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* PIX Key Section if present & enabled */}
              {pdfIncludePix && driverProfile.pixKey && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                        Dados para Pagamento (Chave PIX)
                      </span>
                      <span className="text-xs font-mono font-bold text-white select-all">
                        {driverProfile.pixKey}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-300/80 font-medium hidden sm:inline">
                    Favorecido: {driverProfile.name}
                  </span>
                </div>
              )}

              {/* Summary stats row */}
              {(() => {
                const stats = [
                  pdfIncludeTripsCount && { key: 'trips', label: 'Viagens', val: pdfTotalTrips, color: 'text-white' },
                  pdfIncludeKmTotal && { key: 'km', label: 'KM Total', val: `${pdfTotalKm.toLocaleString('pt-BR')} km`, color: 'text-white' },
                  pdfIncludeCombustivel && { key: 'fuel', label: 'Combustível', val: `R$ ${pdfFuelExpensesForMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, color: 'text-rose-400' },
                  pdfIncludeFaturamento && { key: 'revenue', label: 'Faturamento', val: `R$ ${pdfTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-emerald-400' },
                ].filter(Boolean) as { key: string; label: string; val: string | number; color: string }[];

                if (stats.length === 0) return null;

                const gridLayoutClass =
                  stats.length === 1
                    ? 'grid-cols-1'
                    : stats.length === 2
                    ? 'grid-cols-2'
                    : stats.length === 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-4';

                return (
                  <div
                    className={`grid ${gridLayoutClass} gap-2.5 bg-[#1E2129] p-3 rounded-xl border border-white/10 text-center`}
                  >
                    {stats.map((s) => (
                      <div
                        key={s.key}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.03] sm:bg-transparent border border-white/5 sm:border-0 min-w-0"
                      >
                        <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider block whitespace-nowrap">
                          {s.label}
                        </span>
                        <span className={`text-xs sm:text-sm font-bold tracking-normal mt-0.5 whitespace-nowrap overflow-visible leading-normal ${s.color}`}>
                          {s.val}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Table of items */}
              {pdfIncludeTable && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#1E2129]">
                      {!isGeneratingPdf && (
                        <th className="p-2 font-bold text-slate-300 w-8 text-center no-print">
                          <input
                            type="checkbox"
                            checked={pdfJobsForMonth.length > 0 && selectedJobIds.length === pdfJobsForMonth.length}
                            onChange={toggleSelectAll}
                            className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="p-2 font-bold text-slate-300">Código</th>
                      <th className="p-2 font-bold text-slate-300">Cliente</th>
                      <th className="p-2 font-bold text-slate-300">KM</th>
                      <th className="p-2 font-bold text-right text-slate-300">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pdfJobsForMonth.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isGeneratingPdf ? 4 : 5}
                          className="p-8 text-center text-slate-400 text-xs italic"
                        >
                          Nenhuma viagem registrada para o período de {pdfPeriodLabel}.
                        </td>
                      </tr>
                    ) : (
                      pdfJobsForMonth.map((j) => {
                        const isSelected = selectedJobIds.includes(j.id);
                        if (isGeneratingPdf && !isSelected) return null;

                        return (
                          <tr
                            key={j.id}
                            onClick={() => !isGeneratingPdf && toggleJobSelection(j.id)}
                            className={`transition-colors cursor-pointer ${
                              !isSelected && !isGeneratingPdf ? 'opacity-35 bg-slate-900/40' : 'hover:bg-slate-800/30'
                            }`}
                          >
                            {!isGeneratingPdf && (
                              <td className="p-2 text-center no-print" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleJobSelection(j.id)}
                                  className="w-3.5 h-3.5 rounded accent-indigo-500 cursor-pointer"
                                />
                              </td>
                            )}
                            <td className={`p-2 font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500 line-through'}`}>
                              {j.code}
                            </td>
                            <td className={`p-2 ${isSelected ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                              {j.clientName}
                            </td>
                            <td className={`p-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                              {j.kmTotal} km
                            </td>
                            <td className={`p-2 text-right font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`}>
                              R$ {j.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-slate-400 flex justify-between">
                <span>Assinatura do Responsável: ___________________________</span>
                <span>Rota Fácil Document #PDF-8829</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/10 no-print">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Baixar PDF
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="py-3 px-4 bg-[#1E2129] hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
