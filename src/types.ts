export type JobStatus = 'Finalizado' | 'Em Trânsito' | 'Pendente' | 'Agendado';

export type JobClassification = 'normal' | 'saturday' | 'sunday' | 'holiday' | 'no_work';

export type ServiceCategory = 'PESSOAL' | 'CARGA';

export interface Job {
  id: string;
  code: string;
  title: string;
  clientName: string;
  routeFrom: string;
  routeTo: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  kmInitial: number;
  kmFinal: number;
  kmTotal: number;
  vehicleModel: string;
  vehiclePlate: string;
  peopleCount: number;
  serviceType: ServiceCategory;
  amount: number;
  classification: JobClassification;
  status: JobStatus;
  notes: string;
  createdAt: string;
}

export type ExpenseCategory = 'combustivel' | 'pedagio' | 'manutencao' | 'alimentacao' | 'outros' | string;

export interface CategoryItem {
  id: string;
  name: string;
  key: string;
  isDefault?: boolean;
}

export interface Expense {
  id: string;
  code: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  time: string;
  vehiclePlate: string;
  clientName?: string;
  receiptImage?: string;
  notes?: string;
  status: 'Pago' | 'Pendente';
  fuelPricePerLiter?: number;
  fuelLiters?: number;
  kmAtRefuel?: number;
  kmDriven?: number;
  maintenanceType?: 'troca_pecas' | 'troca_oleo';
  currentKm?: number;
}

export interface Client {
  id: string;
  name: string;
  type: 'PJ' | 'PF';
  autoFill: boolean;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  nickname: string;
  image: string;
  active: boolean;
  kmCurrent: number;
  nextMaintenanceKm?: number;
  maintenanceIntervalKm?: number;
  lastMaintenanceKm?: number;
  lastMaintenanceDate?: string;
}

export interface DriverProfile {
  name: string;
  role: string;
  fleetId: string;
  phone: string;
  email?: string;
  isPrimaryAccount?: boolean;
  authProvider?: 'google' | 'email';
  cnh: string;
  avatar: string;
  privacyHideFinancials: boolean;
  defaultJobValue: number;
  defaultVehiclePlate?: string;
  defaultServiceType?: ServiceCategory;
  lastPeopleCount?: number;
  pixKey?: string;
  cnpj?: string;
}

export type TabType = 'dashboard' | 'jobs' | 'job_form' | 'expenses' | 'reports' | 'settings';
