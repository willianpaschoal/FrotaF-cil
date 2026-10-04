import React, { createContext, useContext, useState, useEffect } from 'react';
import { Job, Expense, Client, Vehicle, DriverProfile, TabType, CategoryItem } from '../types';
import {
  INITIAL_DRIVER_PROFILE,
  INITIAL_CLIENTS,
  INITIAL_VEHICLES,
  INITIAL_JOBS,
  INITIAL_EXPENSES,
  INITIAL_CATEGORIES,
} from '../data/mockData';

interface FleetContextType {
  driverProfile: DriverProfile;
  clients: Client[];
  vehicles: Vehicle[];
  jobs: Job[];
  expenses: Expense[];
  categories: CategoryItem[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  togglePrivacy: () => void;
  addJob: (jobData: Omit<Job, 'id' | 'code' | 'createdAt'>) => void;
  updateJob: (id: string, jobData: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  addExpense: (expenseData: Omit<Expense, 'id' | 'code'>) => void;
  updateExpense: (id: string, expenseData: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addClient: (clientData: Omit<Client, 'id'>) => void;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addVehicle: (vehicleData: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, vehicleData: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  recordVehicleMaintenance: (
    vehicleId: string,
    options: {
      performedKm: number;
      nextLimitKm: number;
      maintenanceIntervalKm?: number;
      expenseAmount?: number;
      expenseNotes?: string;
    }
  ) => void;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  updateProfile: (profileData: Partial<DriverProfile>) => void;
  resetAllData: () => void;
  selectedDate: string;
  setSelectedDate: (dateStr: string) => void;
  isAuthenticated: boolean;
  loginWithGoogle: (email: string, name?: string, photoUrl?: string) => void;
  logout: () => void;
  openDriverModalOnLogin: boolean;
  setOpenDriverModalOnLogin: (open: boolean) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const ACTIVE_USER_EMAIL_KEY = 'fleetops_active_user_email_v1';
export const AUTH_SESSION_KEY = 'fleetops_auth_session_v1';
export const LEGACY_STORAGE_KEY = 'fleetops_app_data_v1';

export const getUserStorageKey = (email: string): string => {
  return `fleetops_user_data_${email.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_')}`;
};

export const createDefaultUserDataForUser = (
  name: string,
  email: string,
  photoUrl?: string
) => {
  const cleanName = name?.trim() === 'Motorista' ? '' : (name?.trim() || '');
  const cleanEmail = email.trim();

  const profile: DriverProfile = {
    name: cleanName,
    role: '',
    fleetId: '',
    phone: '',
    email: cleanEmail,
    isPrimaryAccount: true,
    authProvider: 'google',
    cnh: '',
    avatar: photoUrl || '',
    privacyHideFinancials: false,
    defaultJobValue: 0,
    defaultVehiclePlate: '',
    lastPeopleCount: 1,
    pixKey: '',
    cnpj: '',
  };

  return {
    driverProfile: profile,
    clients: [] as Client[],
    vehicles: [] as Vehicle[],
    jobs: [] as Job[],
    expenses: [] as Expense[],
    categories: INITIAL_CATEGORIES,
  };
};

const getInitialActiveSession = () => {
  // Purge any old demo Carlos account
  try {
    localStorage.removeItem('fleetops_user_data_carlos.silva@rotafacil.com.br');
    localStorage.removeItem('fleetops_user_data_carlos_silva@rotafacil_com_br');
  } catch (e) {}

  const session = localStorage.getItem(AUTH_SESSION_KEY);
  const activeEmail = localStorage.getItem(ACTIVE_USER_EMAIL_KEY);

  // ONLY authenticate if the user explicitly has an active logged-in session on THIS device
  if (session === 'logged_in' && activeEmail) {
    const userKey = getUserStorageKey(activeEmail);
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { email: activeEmail, isAuthenticated: true, data: parsed };
      } catch (e) {}
    }
  }

  // Any new visitor, shared link, or unauthenticated session MUST see the login screen
  return { email: null, isAuthenticated: false, data: null };
};

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialSession = getInitialActiveSession();
  const [activeUserEmail, setActiveUserEmail] = useState<string | null>(initialSession.email);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialSession.isAuthenticated);

  const [driverProfile, setDriverProfile] = useState<DriverProfile>(() => {
    return (
      initialSession.data?.driverProfile || {
        name: '',
        role: 'Motorista',
        fleetId: '',
        phone: '',
        email: '',
        isPrimaryAccount: true,
        cnh: '',
        avatar: '',
        privacyHideFinancials: false,
        defaultJobValue: 150.0,
      }
    );
  });

  const [clients, setClients] = useState<Client[]>(() => {
    return initialSession.data?.clients || [];
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    return initialSession.data?.vehicles || [];
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    return initialSession.data?.jobs || [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    return initialSession.data?.expenses || [];
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    return initialSession.data?.categories || INITIAL_CATEGORIES;
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [openDriverModalOnLogin, setOpenDriverModalOnLogin] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  // Save to the active user's isolated local storage whenever state changes
  useEffect(() => {
    if (!isAuthenticated || !activeUserEmail) return;
    const userKey = getUserStorageKey(activeUserEmail);
    const dataToSave = {
      driverProfile,
      clients,
      vehicles,
      jobs,
      expenses,
      categories,
    };
    try {
      localStorage.setItem(userKey, JSON.stringify(dataToSave));
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
  }, [driverProfile, clients, vehicles, jobs, expenses, categories, isAuthenticated, activeUserEmail]);

  const togglePrivacy = () => {
    setDriverProfile((prev) => ({
      ...prev,
      privacyHideFinancials: !prev.privacyHideFinancials,
    }));
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(20);
    }
  };

  const addJob = (jobData: Omit<Job, 'id' | 'code' | 'createdAt'>) => {
    const newId = `job-${Date.now()}`;
    const newCode = `#FO-${Math.floor(1000 + Math.random() * 9000)}`;
    const newJob: Job = {
      ...jobData,
      id: newId,
      code: newCode,
      createdAt: new Date().toISOString(),
    };
    setJobs((prev) => [newJob, ...prev]);

    // Automatically update vehicle's current km if higher
    if (jobData.vehiclePlate && jobData.kmFinal) {
      setVehicles((prev) =>
        prev.map((v) => {
          if (
            v.plate.toUpperCase() === jobData.vehiclePlate.toUpperCase() &&
            jobData.kmFinal > v.kmCurrent
          ) {
            return { ...v, kmCurrent: jobData.kmFinal };
          }
          return v;
        })
      );
    }
  };

  const updateJob = (id: string, jobData: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...jobData } : j)));

    if (jobData.vehiclePlate && jobData.kmFinal) {
      setVehicles((prev) =>
        prev.map((v) => {
          if (
            v.plate.toUpperCase() === jobData.vehiclePlate!.toUpperCase() &&
            jobData.kmFinal! > v.kmCurrent
          ) {
            return { ...v, kmCurrent: jobData.kmFinal! };
          }
          return v;
        })
      );
    }
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const addExpense = (expenseData: Omit<Expense, 'id' | 'code'>) => {
    const newId = `exp-${Date.now()}`;
    const newCode = `#DES-${Math.floor(100 + Math.random() * 900)}`;
    const newExpense: Expense = {
      ...expenseData,
      id: newId,
      code: newCode,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const updateExpense = (id: string, expenseData: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...expenseData } : e)));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const addClient = (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
    };
    setClients((prev) => [...prev, newClient]);
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...clientData } : c)));
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const addVehicle = (vehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `veh-${Date.now()}`,
      nextMaintenanceKm:
        vehicleData.nextMaintenanceKm ||
        Math.ceil(((vehicleData.kmCurrent || 10000) + 10000) / 10000) * 10000,
      maintenanceIntervalKm: vehicleData.maintenanceIntervalKm || 10000,
      lastMaintenanceKm: vehicleData.kmCurrent || 0,
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
    };
    setVehicles((prev) => [...prev, newVehicle]);
  };

  const updateVehicle = (id: string, vehicleData: Partial<Vehicle>) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...vehicleData } : v)));
  };

  const deleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const recordVehicleMaintenance = (
    vehicleId: string,
    options: {
      performedKm: number;
      nextLimitKm: number;
      maintenanceIntervalKm?: number;
      expenseAmount?: number;
      expenseNotes?: string;
    }
  ) => {
    const targetVehicle = vehicles.find((v) => v.id === vehicleId);
    if (!targetVehicle) return;

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          return {
            ...v,
            kmCurrent: Math.max(v.kmCurrent, options.performedKm),
            lastMaintenanceKm: options.performedKm,
            lastMaintenanceDate: new Date().toISOString().split('T')[0],
            nextMaintenanceKm: options.nextLimitKm,
            maintenanceIntervalKm:
              options.maintenanceIntervalKm || v.maintenanceIntervalKm || 10000,
          };
        }
        return v;
      })
    );

    if (options.expenseAmount && options.expenseAmount > 0) {
      addExpense({
        title: `Revisão / Manutenção (${targetVehicle.plate})`,
        category: 'manutencao',
        amount: options.expenseAmount,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        vehiclePlate: targetVehicle.plate,
        notes:
          options.expenseNotes ||
          `Manutenção periódica realizada aos ${options.performedKm.toLocaleString('pt-BR')} km. Próximo limite: ${options.nextLimitKm.toLocaleString('pt-BR')} km.`,
        status: 'Pago',
        kmAtRefuel: options.performedKm,
      });
    }

    if (window.navigator?.vibrate) {
      window.navigator.vibrate([30, 50, 30]);
    }
  };

  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_');
    if (categories.some((c) => c.key === key || c.name.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      key: key || `cat_${Date.now()}`,
      isDefault: false,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const updateProfile = (profileData: Partial<DriverProfile>) => {
    setDriverProfile((prev) => {
      const updated = { ...prev, ...profileData };
      if (profileData.email && profileData.email.trim().toLowerCase() !== activeUserEmail) {
        const newEmailClean = profileData.email.trim().toLowerCase();
        const newKey = getUserStorageKey(newEmailClean);
        const dataToSave = {
          driverProfile: updated,
          clients,
          vehicles,
          jobs,
          expenses,
          categories,
        };
        try {
          localStorage.setItem(newKey, JSON.stringify(dataToSave));
          localStorage.setItem(ACTIVE_USER_EMAIL_KEY, newEmailClean);
          setActiveUserEmail(newEmailClean);
        } catch (e) {}
      }
      return updated;
    });
  };

  const loginWithGoogle = (email: string, name?: string, photoUrl?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const userKey = getUserStorageKey(cleanEmail);
    const existing = localStorage.getItem(userKey);

    let userData;
    if (existing) {
      try {
        userData = JSON.parse(existing);
        if (name && userData.driverProfile) {
          userData.driverProfile.name = name.trim();
        }
        if (photoUrl && userData.driverProfile) {
          userData.driverProfile.avatar = photoUrl;
        }
      } catch (e) {
        userData = createDefaultUserDataForUser(name || '', cleanEmail, photoUrl);
      }
    } else {
      // Brand new user downloading the app: create clean, private account
      userData = createDefaultUserDataForUser(name || '', cleanEmail, photoUrl);
      try {
        localStorage.setItem(userKey, JSON.stringify(userData));
      } catch (e) {}
    }

    setDriverProfile(userData.driverProfile);
    setClients(userData.clients || []);
    setVehicles(userData.vehicles || []);
    setJobs(userData.jobs || []);
    setExpenses(userData.expenses || []);
    setCategories(userData.categories || INITIAL_CATEGORIES);

    setActiveUserEmail(cleanEmail);
    localStorage.setItem(ACTIVE_USER_EMAIL_KEY, cleanEmail);
    localStorage.setItem(AUTH_SESSION_KEY, 'logged_in');
    setOpenDriverModalOnLogin(true);
    setActiveTab('settings');
    setIsAuthenticated(true);
  };

  const logout = () => {
    if (activeUserEmail) {
      const userKey = getUserStorageKey(activeUserEmail);
      const dataToSave = {
        driverProfile,
        clients,
        vehicles,
        jobs,
        expenses,
        categories,
      };
      try {
        localStorage.setItem(userKey, JSON.stringify(dataToSave));
      } catch (e) {}
    }
    setActiveUserEmail(null);
    localStorage.removeItem(ACTIVE_USER_EMAIL_KEY);
    localStorage.setItem(AUTH_SESSION_KEY, 'logged_out');
    setIsAuthenticated(false);
  };

  const resetAllData = () => {
    if (activeUserEmail) {
      const userKey = getUserStorageKey(activeUserEmail);
      localStorage.removeItem(userKey);
    }
    localStorage.removeItem(ACTIVE_USER_EMAIL_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.setItem(AUTH_SESSION_KEY, 'logged_out');
    setActiveUserEmail(null);
    setIsAuthenticated(false);
  };

  return (
    <FleetContext.Provider
      value={{
        driverProfile,
        clients,
        vehicles,
        jobs,
        expenses,
        categories,
        activeTab,
        setActiveTab,
        togglePrivacy,
        addJob,
        updateJob,
        deleteJob,
        addExpense,
        updateExpense,
        deleteExpense,
        addClient,
        updateClient,
        deleteClient,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        recordVehicleMaintenance,
        addCategory,
        deleteCategory,
        updateProfile,
        resetAllData,
        selectedDate,
        setSelectedDate,
        isAuthenticated,
        loginWithGoogle,
        logout,
        openDriverModalOnLogin,
        setOpenDriverModalOnLogin,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
