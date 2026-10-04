import { Job, Vehicle } from '../types';

/**
 * Retorna o KM final do card anterior (ou do último trabalho registrado para o veículo/data).
 * 
 * @param jobs Lista de trabalhos cadastrados
 * @param targetDate Data de referência (YYYY-MM-DD), normalmente a data do novo trabalho/despesa
 * @param vehiclePlateOrStr Placa ou string do veículo selecionado (ex: "ABC-1234" ou "Scania R450 (ABC-1234)")
 * @param vehicles Lista de veículos da frota para fallback
 */
export function getPreviousDayFinalKm(
  jobs: Job[],
  targetDate: string,
  vehiclePlateOrStr?: string,
  vehicles?: Vehicle[]
): number | '' {
  // Extrai a placa limpa se houver formato "Modelo (PLACA)"
  let targetPlate = '';
  if (vehiclePlateOrStr) {
    const match = vehiclePlateOrStr.match(/\(([^)]+)\)/);
    targetPlate = (match ? match[1] : vehiclePlateOrStr).trim().toUpperCase();
  }

  if (!jobs || jobs.length === 0) {
    if (targetPlate && vehicles) {
      const v = vehicles.find(
        (veh) => veh.plate.toUpperCase() === targetPlate || veh.model === vehiclePlateOrStr
      );
      if (v?.kmCurrent && v.kmCurrent > 0) return v.kmCurrent;
    }
    return '';
  }

  // Filtra trabalhos do veículo alvo
  const vehicleJobs = targetPlate
    ? jobs.filter((j) => {
        if (j.vehiclePlate && j.vehiclePlate.trim().toUpperCase() === targetPlate) {
          return true;
        }
        if (j.vehicleModel && j.vehicleModel.toUpperCase().includes(targetPlate)) {
          return true;
        }
        return false;
      })
    : jobs;

  const candidateJobs = vehicleJobs.length > 0 ? vehicleJobs : jobs;

  // 1. Procura trabalhos que ocorreram no mesmo dia ou antes da targetDate (cards anteriores ao novo registro)
  const priorJobs = candidateJobs.filter((j) => {
    const jobDate = j.endDate || j.startDate;
    if (!jobDate) return true;
    return Boolean(jobDate <= targetDate);
  });

  if (priorJobs.length > 0) {
    // Ordena por data decrescente (o mais recente primeiro), depois por horário, depois por criação, depois por kmFinal
    priorJobs.sort((a, b) => {
      const dateA = a.endDate || a.startDate || '';
      const dateB = b.endDate || b.startDate || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);

      const timeA = a.endTime || a.startTime || '00:00';
      const timeB = b.endTime || b.startTime || '00:00';
      if (timeB !== timeA) return timeB.localeCompare(timeA);

      if (a.createdAt && b.createdAt) {
        const createdA = new Date(a.createdAt).getTime() || 0;
        const createdB = new Date(b.createdAt).getTime() || 0;
        if (createdB !== createdA) return createdB - createdA;
      }

      return (b.kmFinal || 0) - (a.kmFinal || 0);
    });

    // Pega o card anterior mais recente que possui kmFinal registrado (ou kmInitial como fallback)
    const bestPriorJob = priorJobs.find((j) => j.kmFinal && j.kmFinal > 0) || priorJobs[0];
    if (bestPriorJob) {
      if (bestPriorJob.kmFinal && bestPriorJob.kmFinal > 0) {
        return bestPriorJob.kmFinal;
      }
      if (bestPriorJob.kmInitial && bestPriorJob.kmInitial > 0) {
        return bestPriorJob.kmInitial;
      }
    }
  }

  // 2. Se não houver card anterior para o veículo específico com data <= targetDate, mas houver em outros veículos
  if (candidateJobs !== jobs) {
    const allPriorJobs = jobs.filter((j) => {
      const jobDate = j.endDate || j.startDate;
      if (!jobDate) return true;
      return Boolean(jobDate <= targetDate);
    });

    if (allPriorJobs.length > 0) {
      allPriorJobs.sort((a, b) => {
        const dateA = a.endDate || a.startDate || '';
        const dateB = b.endDate || b.startDate || '';
        if (dateB !== dateA) return dateB.localeCompare(dateA);

        const timeA = a.endTime || a.startTime || '00:00';
        const timeB = b.endTime || b.startTime || '00:00';
        if (timeB !== timeA) return timeB.localeCompare(timeA);

        if (a.createdAt && b.createdAt) {
          const createdA = new Date(a.createdAt).getTime() || 0;
          const createdB = new Date(b.createdAt).getTime() || 0;
          if (createdB !== createdA) return createdB - createdA;
        }

        return (b.kmFinal || 0) - (a.kmFinal || 0);
      });
      const best = allPriorJobs.find((j) => j.kmFinal && j.kmFinal > 0) || allPriorJobs[0];
      if (best?.kmFinal && best.kmFinal > 0) return best.kmFinal;
      if (best?.kmInitial && best.kmInitial > 0) return best.kmInitial;
    }
  }

  // 3. Fallback: Se não existir nenhum card com data <= targetDate (ex: targetDate foi preenchida com data antiga),
  // pega o trabalho mais recente de candidateJobs
  const allSorted = [...candidateJobs].sort((a, b) => {
    const dateA = a.endDate || a.startDate || '';
    const dateB = b.endDate || b.startDate || '';
    if (dateB !== dateA) return dateB.localeCompare(dateA);

    const timeA = a.endTime || a.startTime || '00:00';
    const timeB = b.endTime || b.startTime || '00:00';
    if (timeB !== timeA) return timeB.localeCompare(timeA);

    if (a.createdAt && b.createdAt) {
      const createdA = new Date(a.createdAt).getTime() || 0;
      const createdB = new Date(b.createdAt).getTime() || 0;
      if (createdB !== createdA) return createdB - createdA;
    }

    return (b.kmFinal || 0) - (a.kmFinal || 0);
  });

  const latestWithKm = allSorted.find((j) => j.kmFinal && j.kmFinal > 0) || allSorted[0];
  if (latestWithKm?.kmFinal && latestWithKm.kmFinal > 0) {
    return latestWithKm.kmFinal;
  }
  if (latestWithKm?.kmInitial && latestWithKm.kmInitial > 0) {
    return latestWithKm.kmInitial;
  }

  // Fallback 4: odômetro do cadastro do veículo
  if (targetPlate && vehicles) {
    const v = vehicles.find((veh) => veh.plate.toUpperCase() === targetPlate);
    if (v?.kmCurrent && v.kmCurrent > 0) return v.kmCurrent;
  }

  return '';
}
