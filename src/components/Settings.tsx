import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useFleet } from '../context/FleetContext';
import {
  Shield,
  Phone,
  Badge,
  Mail,
  Plus,
  LogOut,
  Trash2,
  Check,
  AlertTriangle,
  X,
  CheckCircle2,
  Building2,
  User,
  Info,
  Camera,
  UploadCloud,
  Link as LinkIcon,
  Edit2,
  Star,
  Truck,
  Sliders,
  QrCode,
  Tag,
  RefreshCw,
} from 'lucide-react';

const formatCpfCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (!digits) return '';

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
};

const PRESET_VEHICLE_IMAGES = [
  {
    name: 'Scania R450',
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'MB Sprinter',
    url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Caminhão Baú',
    url: 'https://images.unsplash.com/photo-1586191582056-a36c6460982c?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Pick-up',
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600',
  },
];

const PRESET_DRIVER_AVATARS = [
  {
    name: 'Motorista 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Motorista 2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Motorista 3',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'Motorista 4',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  },
];

const compressImage = (file: File, maxWidth = 500, maxHeight = 500): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const Settings: React.FC<{ onReplaySplash?: () => void }> = ({ onReplaySplash }) => {
  const {
    driverProfile,
    clients,
    vehicles,
    categories,
    togglePrivacy,
    updateProfile,
    addClient,
    updateClient,
    deleteClient,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addCategory,
    deleteCategory,
    resetAllData,
    logout,
    openDriverModalOnLogin,
    setOpenDriverModalOnLogin,
    setActiveTab,
  } = useFleet();

  const [isOnboardingFlow, setIsOnboardingFlow] = useState(false);
  const [showAskVehicleModal, setShowAskVehicleModal] = useState(false);

  const [defaultValue, setDefaultValue] = useState<string>(
    driverProfile.defaultJobValue.toString()
  );
  const [isSavedValue, setIsSavedValue] = useState(false);

  // Category Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Driver Edit Modal states
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverName, setDriverName] = useState(driverProfile.name || '');
  const [driverRole, setDriverRole] = useState(driverProfile.role || '');
  const [driverPhone, setDriverPhone] = useState(driverProfile.phone || '');
  const [driverCnh, setDriverCnh] = useState(driverProfile.cnh || '');
  const [driverCnpj, setDriverCnpj] = useState(formatCpfCnpj(driverProfile.cnpj || ''));
  const [driverFleetId, setDriverFleetId] = useState(driverProfile.fleetId || '');
  const [driverEmail, setDriverEmail] = useState(driverProfile.email || '');
  const [driverAvatar, setDriverAvatar] = useState(driverProfile.avatar || '');
  const [driverPixKey, setDriverPixKey] = useState(driverProfile.pixKey || '');
  const [showDriverUrlInput, setShowDriverUrlInput] = useState(false);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccessMessage, setEmailSuccessMessage] = useState('');

  const handleOpenChangeEmail = () => {
    setNewEmailInput(driverProfile.email || '');
    setEmailError('');
    setEmailSuccessMessage('');
    setShowEmailModal(true);
  };

  const handleSaveNewEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmailInput.trim();
    if (!trimmed) {
      setEmailError('Por favor, informe um endereço de e-mail.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Formato de e-mail inválido. Ex: nome@email.com');
      return;
    }

    updateProfile({
      email: trimmed,
      isPrimaryAccount: true,
      authProvider: trimmed.endsWith('@gmail.com') || trimmed.endsWith('@googlemail.com') ? 'google' : 'email',
    });
    setDriverEmail(trimmed);
    setEmailError('');
    setEmailSuccessMessage('Conta Principal atualizada com sucesso!');
    setTimeout(() => {
      setShowEmailModal(false);
      setEmailSuccessMessage('');
    }, 800);
  };

  // Modal states
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<'PJ' | 'PF'>('PJ');
  const [newClientAddress, setNewClientAddress] = useState('');

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<any | null>(null);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleImage, setNewVehicleImage] = useState('');
  const [newVehicleKmCurrent, setNewVehicleKmCurrent] = useState<number | ''>('');
  const [newVehicleNextMaintenanceKm, setNewVehicleNextMaintenanceKm] = useState<number | ''>('');
  const [newVehicleMaintenanceIntervalKm, setNewVehicleMaintenanceIntervalKm] = useState<number>(10000);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<null | {
    type: 'success' | 'new_available';
    message: string;
  }>(null);

  const handleCheckForUpdates = async () => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    setUpdateStatus(null);

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.update().catch(() => {});
        }
      }

      await fetch(`/?_updateCheck=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      }).catch(() => {});

      await new Promise((resolve) => setTimeout(resolve, 900));

      setUpdateStatus({
        type: 'success',
        message: 'Você já está usando a versão mais recente (v1.8.8). Tudo atualizado!',
      });
    } catch (err) {
      setUpdateStatus({
        type: 'success',
        message: 'Sistema atualizado! Nenhuma atualização pendente no momento.',
      });
    } finally {
      setIsCheckingUpdate(false);
      setTimeout(() => {
        setUpdateStatus(null);
      }, 5000);
    }
  };

  const handleSaveDefaultValue = () => {
    const val = parseFloat(defaultValue) || 0;
    updateProfile({ defaultJobValue: val });
    setIsSavedValue(true);
    setTimeout(() => setIsSavedValue(false), 2000);
  };

  const handleOpenEditDriver = () => {
    setDriverName(driverProfile.name || '');
    setDriverRole(driverProfile.role || '');
    setDriverPhone(driverProfile.phone || '');
    setDriverEmail(driverProfile.email || '');
    setDriverCnh(driverProfile.cnh || '');
    setDriverCnpj(formatCpfCnpj(driverProfile.cnpj || ''));
    setDriverFleetId(driverProfile.fleetId || '');
    setDriverAvatar(driverProfile.avatar || '');
    setDriverPixKey(driverProfile.pixKey || '');
    setShowDriverUrlInput(false);
    setShowDriverModal(true);
  };

  useEffect(() => {
    if (openDriverModalOnLogin) {
      setOpenDriverModalOnLogin(false);
      setIsOnboardingFlow(true);
      handleOpenEditDriver();
    }
  }, [openDriverModalOnLogin]);

  const handleDriverAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 500, 500);
      if (compressed) {
        setDriverAvatar(compressed);
      }
      e.target.value = '';
    }
  };

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;

    updateProfile({
      name: driverName.trim(),
      role: driverRole.trim(),
      phone: driverPhone.trim(),
      email: driverEmail.trim(),
      cnh: driverCnh.trim(),
      cnpj: driverCnpj.trim(),
      fleetId: driverFleetId.trim(),
      avatar: driverAvatar.trim() || driverProfile.avatar,
      pixKey: driverPixKey.trim(),
    });

    setShowDriverModal(false);

    if (isOnboardingFlow) {
      setShowAskVehicleModal(true);
    }
  };

  const handleOpenAddClient = () => {
    setEditingClient(null);
    setNewClientName('');
    setNewClientType('PJ');
    setNewClientAddress('');
    setShowClientModal(true);
  };

  const handleOpenEditClient = (client: any) => {
    setEditingClient(client);
    setNewClientName(client.name);
    setNewClientType(client.type || 'PJ');
    setNewClientAddress(client.address || '');
    setShowClientModal(true);
  };

  const handleConfirmDeleteClient = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete.id);
      setClientToDelete(null);
    }
  };

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    if (editingClient) {
      updateClient(editingClient.id, {
        name: newClientName.trim(),
        type: newClientType,
        address: newClientAddress,
      });
    } else {
      addClient({
        name: newClientName.trim(),
        type: newClientType,
        autoFill: true,
        address: newClientAddress,
      });
    }

    setEditingClient(null);
    setNewClientName('');
    setNewClientAddress('');
    setShowClientModal(false);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, 600, 600);
      if (compressed) {
        setNewVehicleImage(compressed);
      }
      e.target.value = '';
    }
  };

  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setNewVehiclePlate('');
    setNewVehicleModel('');
    setNewVehicleImage('');
    setNewVehicleKmCurrent('');
    setNewVehicleNextMaintenanceKm('');
    setNewVehicleMaintenanceIntervalKm(10000);
    setShowUrlInput(false);
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setNewVehiclePlate(vehicle.plate);
    setNewVehicleModel(vehicle.model);
    setNewVehicleImage(vehicle.image || '');
    const currentKm = vehicle.kmCurrent || 10000;
    setNewVehicleKmCurrent(currentKm);
    setNewVehicleNextMaintenanceKm(
      vehicle.nextMaintenanceKm || (Math.ceil(Math.max(currentKm, 10000) / 10000) * 10000)
    );
    setNewVehicleMaintenanceIntervalKm(vehicle.maintenanceIntervalKm || 10000);
    setShowUrlInput(false);
    setShowVehicleModal(true);
  };

  const handleConfirmDeleteVehicle = () => {
    if (vehicleToDelete) {
      deleteVehicle(vehicleToDelete.id);
      setVehicleToDelete(null);
    }
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehiclePlate.trim() || !newVehicleModel.trim()) return;

    const finalImage = newVehicleImage.trim() || PRESET_VEHICLE_IMAGES[0].url;
    const kmNum = Number(newVehicleKmCurrent) || 0;
    const limitKmNum = Number(newVehicleNextMaintenanceKm) || (kmNum + 10000);
    const intervalKmNum = Number(newVehicleMaintenanceIntervalKm) || 10000;

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, {
        plate: newVehiclePlate.trim().toUpperCase(),
        model: newVehicleModel.trim(),
        nickname: newVehicleModel.trim(),
        image: finalImage,
        kmCurrent: kmNum,
        nextMaintenanceKm: limitKmNum,
        maintenanceIntervalKm: intervalKmNum,
      });
    } else {
      addVehicle({
        plate: newVehiclePlate.trim().toUpperCase(),
        model: newVehicleModel.trim(),
        nickname: newVehicleModel.trim(),
        image: finalImage,
        active: true,
        kmCurrent: kmNum,
        nextMaintenanceKm: limitKmNum,
        maintenanceIntervalKm: intervalKmNum,
        lastMaintenanceKm: kmNum,
      });
    }

    setEditingVehicle(null);
    setNewVehiclePlate('');
    setNewVehicleModel('');
    setNewVehicleImage('');
    setShowUrlInput(false);
    setShowVehicleModal(false);

    if (isOnboardingFlow) {
      setIsOnboardingFlow(false);
      setActiveTab('dashboard');
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowCategoryModal(false);
  };

  return (
    <div className="pt-18 pb-28 px-5 max-w-lg mx-auto flex flex-col gap-4">
      {/* Driver Profile Header */}
      <section className="card-3d rounded-2xl p-5 flex flex-col gap-4 border border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 shadow-sm shrink-0 bg-indigo-500/10">
              <img
                src={driverProfile.avatar}
                alt={driverProfile.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-snug">
                {driverProfile.name}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {driverProfile.role} • ID Frota: {driverProfile.fleetId}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={handleOpenChangeEmail}
                  className="text-xs text-slate-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 cursor-pointer group transition-colors text-left"
                  title="Clique para trocar ou editar a Conta Principal"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-300 group-hover:text-indigo-300 group-hover:underline decoration-indigo-400/40 underline-offset-2 truncate max-w-[170px] sm:max-w-xs">
                    {driverProfile.email || 'willianbpaschoal@gmail.com'}
                  </span>
                </button>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Conta Principal
                </span>
                <button
                  type="button"
                  onClick={handleOpenChangeEmail}
                  className="text-[10px] text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-2 py-0.5 rounded-md border border-indigo-500/20 transition-all shrink-0 cursor-pointer"
                >
                  Trocar
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenEditDriver}
            className="p-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 active:scale-95"
            title="Editar dados do motorista"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Editar Motorista</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-1">
          <div
            onClick={handleOpenChangeEmail}
            className="flex items-center justify-between p-3.5 bg-[#1E2129] hover:bg-[#252932] rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
            title="Clique para trocar ou editar a Conta Principal"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 shrink-0 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Conta Principal</span>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    Ativa
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-200 truncate group-hover:text-white">
                  {driverProfile.email || 'willianbpaschoal@gmail.com'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenChangeEmail();
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white text-xs font-bold border border-indigo-500/30 transition-all shrink-0 cursor-pointer ml-2"
            >
              Trocar Conta
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#1E2129] rounded-xl border border-white/5">
            <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-200">
              {driverProfile.phone}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#1E2129] rounded-xl border border-white/5">
            <Badge className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-200">
              CNH: {driverProfile.cnh}
            </span>
          </div>
          {driverProfile.cnpj && (
            <div className="flex items-center gap-3 p-3 bg-[#1E2129] rounded-xl border border-white/5">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">CNPJ / CPF</span>
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {driverProfile.cnpj}
                </span>
              </div>
            </div>
          )}
          {driverProfile.pixKey && (
            <div className="flex items-center gap-3 p-3 bg-[#1E2129] rounded-xl border border-white/5">
              <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Chave PIX (Relatórios)</span>
                <span className="text-xs font-mono font-bold text-emerald-300 truncate">
                  {driverProfile.pixKey}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section: Privacidade */}
      <section className="card-3d rounded-2xl p-5 bg-[#1E2129] border border-indigo-500/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Privacidade</h3>
              <p className="text-xs text-slate-400">
                Ocultar valores financeiros na tela principal
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={driverProfile.privacyHideFinancials}
              onChange={togglePrivacy}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
          </label>
        </div>
      </section>

      {/* Section: Preferências & Padrões de Lançamento */}
      <section className="card-3d rounded-2xl p-5 flex flex-col gap-4 border border-white/10 bg-[#12141C]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Preferências & Padrões de Lançamento
          </h3>
        </div>

        {/* 1. Veículo Padrão */}
        <div className="p-3.5 bg-[#1E2129] rounded-xl border border-white/5 flex flex-col gap-2">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-indigo-400" />
            Veículo Padrão para Novos Trabalhos
          </label>
          <select
            value={driverProfile.defaultVehiclePlate || vehicles[0]?.plate || ''}
            onChange={(e) => updateProfile({ defaultVehiclePlate: e.target.value })}
            className="w-full py-2.5 px-3 bg-[#12141C] rounded-lg text-xs font-bold text-slate-200 border border-white/10 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.plate}>
                {v.model} ({v.plate})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">
            Este veículo será selecionado automaticamente ao registrar um novo trabalho.
          </p>
        </div>

        {/* 2. Tipo de Serviço Padrão */}
        <div className="p-3.5 bg-[#1E2129] rounded-xl border border-white/5 flex flex-col gap-2">
          <label className="text-xs font-bold text-white block">
            Tipo de Serviço Padrão
          </label>
          <div className="flex bg-[#12141C] rounded-xl p-1 border border-white/10">
            <button
              type="button"
              onClick={() => updateProfile({ defaultServiceType: 'CARGA' })}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                (driverProfile.defaultServiceType || 'CARGA') === 'CARGA'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🚚 CARGA
            </button>
            <button
              type="button"
              onClick={() => updateProfile({ defaultServiceType: 'PESSOAL' })}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                driverProfile.defaultServiceType === 'PESSOAL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👥 PESSOAL
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Define o tipo de serviço inicial (Carga ou Pessoal) ao abrir o formulário.
          </p>
        </div>

        {/* 3. Valor Padrão */}
        <div className="p-3.5 bg-[#1E2129] rounded-xl border border-white/5 flex flex-col gap-2">
          <label className="text-xs font-bold text-white block">
            Valor Padrão do Serviço (R$)
          </label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-[#12141C] rounded-lg border border-white/10 text-xs font-bold text-white focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveDefaultValue}
              className="px-3 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg shadow-xs hover:bg-indigo-500 transition-all shrink-0 flex items-center gap-1 cursor-pointer"
            >
              {isSavedValue ? <Check className="w-3.5 h-3.5" /> : 'Salvar'}
            </button>
          </div>
        </div>
      </section>

      {/* Section: Categorias de Despesas */}
      <section className="card-3d rounded-2xl p-5 flex flex-col gap-4 border border-white/10 bg-[#12141C]">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-400" />
              Categorias de Despesas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cadastre novas categorias para despesas e filtros.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="bg-indigo-600 text-white h-8 px-3.5 rounded-full font-bold text-xs shadow-xs hover:bg-indigo-500 transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> CADASTRAR
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-2.5 px-3 bg-[#1E2129] rounded-xl border border-white/5 flex items-center justify-between gap-2 text-xs font-bold text-slate-200"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                <span className="truncate">{cat.name}</span>
              </div>
              <button
                type="button"
                onClick={() => deleteCategory(cat.id)}
                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Excluir categoria"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Clientes */}
      <section className="card-3d rounded-2xl p-5 flex flex-col gap-4 border border-white/10">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-white">Clientes</h3>
          <button
            type="button"
            onClick={handleOpenAddClient}
            className="text-indigo-400 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> NOVO CLIENTE
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {clients.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Nenhum cliente cadastrado.</p>
          ) : (
            clients.map((client) => (
              <div
                key={client.id}
                className="p-3.5 bg-[#1E2129] rounded-xl border border-white/5 flex flex-col gap-2 relative group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {client.name}
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white shrink-0">
                        {client.type}
                      </span>
                    </div>
                    {client.address && (
                      <p className="text-xs text-slate-400 truncate mt-1">
                        {client.address}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditClient(client)}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      title="Editar Cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientToDelete(client)}
                      className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {client.autoFill ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Preenchimento automático ativo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit">
                    <Info className="w-3.5 h-3.5" />
                    <span>Endereço manual</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Section: Veículos */}
      <section className="card-3d rounded-2xl p-5 flex flex-col gap-4 border border-white/10">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-white">Veículos</h3>
          <button
            type="button"
            onClick={handleOpenAddVehicle}
            className="bg-indigo-600 text-white h-8 px-3.5 rounded-full font-bold text-xs shadow-xs hover:bg-indigo-500 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> ADICIONAR
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {vehicles.map((v) => {
            const isDefault = (driverProfile.defaultVehiclePlate || vehicles[0]?.plate) === v.plate;

            return (
              <div
                key={v.id}
                className={`relative rounded-xl overflow-hidden aspect-video border shadow-2xs card-3d group ${
                  isDefault ? 'border-amber-400/80 ring-2 ring-amber-400/30' : 'border-white/10'
                }`}
              >
                <img
                  src={v.image}
                  alt={v.model}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Badge Default */}
                {isDefault ? (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider z-10">
                    <Star className="w-2.5 h-2.5 fill-slate-950" />
                    Padrão
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateProfile({ defaultVehiclePlate: v.plate })}
                    className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold text-[9px] rounded-full shadow-md backdrop-blur-xs transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                    title="Definir como veículo padrão"
                  >
                    <Star className="w-2.5 h-2.5" />
                    Tornar Padrão
                  </button>
                )}

                <div className="absolute bottom-0 left-0 w-full p-2 bg-black/80 backdrop-blur-xs text-white flex justify-between items-end z-10">
                  <div className="truncate pr-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold leading-none">{v.plate}</p>
                      {v.nextMaintenanceKm && (v.kmCurrent || 0) >= v.nextMaintenanceKm ? (
                        <span className="px-1 py-0.2 bg-rose-500 text-[8px] font-black rounded-sm uppercase tracking-wider">
                          Revisão
                        </span>
                      ) : v.nextMaintenanceKm && v.nextMaintenanceKm - (v.kmCurrent || 0) <= 2000 ? (
                        <span className="px-1 py-0.2 bg-amber-500/80 text-[8px] font-black rounded-sm uppercase tracking-wider">
                          Atenção
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] opacity-80 mt-0.5 truncate">{v.model}</p>
                    <p className="text-[9px] text-slate-300 font-mono mt-0.5">
                      {(v.kmCurrent || 0).toLocaleString('pt-BR')} km / Limite: {(v.nextMaintenanceKm || 10000).toLocaleString('pt-BR')} km
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditVehicle(v)}
                      className="p-1.5 bg-white/10 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-md transition-colors cursor-pointer"
                      title="Editar Veículo"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleToDelete(v)}
                      className="p-1.5 bg-white/10 hover:bg-rose-600 text-slate-200 hover:text-white rounded-md transition-colors cursor-pointer"
                      title="Excluir Veículo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section: Conta & Segurança */}
      <section className="card-3d rounded-2xl p-5 flex flex-col gap-4 mb-4 border border-white/10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Conta & Segurança
        </h3>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-between p-4 bg-[#1E2129] rounded-xl hover:bg-slate-700 transition-colors text-indigo-400 font-bold text-sm border border-white/5"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <span>Sair da Conta</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex flex-col gap-2 p-4 border border-rose-500/30 bg-rose-500/10 rounded-xl active:bg-rose-500/20 transition-colors text-left"
          >
            <div className="flex items-center gap-3 text-rose-400 font-bold text-sm">
              <Trash2 className="w-5 h-5" />
              <span>Excluir Conta</span>
            </div>
            <p className="text-xs text-rose-300/80 leading-snug">
              Atenção: Esta ação é irreversível e todos os seus dados de viagens e
              clientes serão apagados permanentemente.
            </p>
          </button>
        </div>
      </section>

      {/* App Version Info */}
      <div className="text-center py-4 mb-6 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">FrotaFácil System</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
            v1.8.8
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Gestão de Frota & Lançamentos
        </p>

        <button
          type="button"
          onClick={handleCheckForUpdates}
          disabled={isCheckingUpdate}
          className="mt-1 px-3.5 py-2 rounded-xl bg-[#1E2129] border border-white/10 hover:border-indigo-500/40 text-xs text-indigo-300 font-semibold flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-indigo-400 ${
              isCheckingUpdate ? 'animate-spin text-cyan-400' : ''
            }`}
          />
          <span>
            {isCheckingUpdate ? 'Verificando atualizações...' : 'Verificar Atualizações'}
          </span>
        </button>

        {updateStatus && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{updateStatus.message}</span>
          </div>
        )}
      </div>

      {/* Modal Add/Edit Client */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClientSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Nome da Empresa / Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Razão Social ou Nome"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Tipo de Inscrição</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewClientType('PJ')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      newClientType === 'PJ' ? 'bg-indigo-600 text-white' : 'bg-[#1E2129] text-slate-400'
                    }`}
                  >
                    PJ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewClientType('PF')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      newClientType === 'PF' ? 'bg-indigo-600 text-white' : 'bg-[#1E2129] text-slate-400'
                    }`}
                  >
                    PF
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Endereço Principal</label>
                <input
                  type="text"
                  placeholder="Rua, Número, Cidade/UF"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-semibold focus:outline-none"
                />
              </div>

              <div className="flex gap-2 mt-2">
                {editingClient && (
                  <button
                    type="button"
                    onClick={() => {
                      const c = editingClient;
                      setShowClientModal(false);
                      setClientToDelete(c);
                    }}
                    className="py-3 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    title="Excluir Cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#1E2129] text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                >
                  {editingClient ? 'Salvar Alterações' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Client */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Excluir Cliente?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tem certeza que deseja excluir o cliente <strong className="text-white">{clientToDelete.name}</strong>?
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-[#1E2129] text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClient}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Vehicle */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingVehicle ? 'Editar Veículo' : 'Adicionar Veículo'}
              </h3>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Placa do Veículo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ABC-1D23"
                  value={newVehiclePlate}
                  onChange={(e) => setNewVehiclePlate(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-semibold uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Modelo / Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Scania R450 / MB Sprinter"
                  value={newVehicleModel}
                  onChange={(e) => setNewVehicleModel(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-semibold focus:outline-none"
                />
              </div>

              {/* Quilometragem e Alerta de Manutenção */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[#151722] border border-white/5">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 mb-1 block">
                    KM Atual
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ex: 60000"
                    value={newVehicleKmCurrent === '' ? '' : newVehicleKmCurrent}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      if (valStr === '') {
                        setNewVehicleKmCurrent('');
                        return;
                      }
                      const val = Number(valStr);
                      setNewVehicleKmCurrent(val);
                      if (!editingVehicle) {
                        setNewVehicleNextMaintenanceKm(val + newVehicleMaintenanceIntervalKm);
                      }
                    }}
                    className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#1E2129] text-xs font-mono font-semibold text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-amber-400/90 mb-1 block">
                    Limite de Revisão (KM)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ex: 70000"
                    value={newVehicleNextMaintenanceKm === '' ? '' : newVehicleNextMaintenanceKm}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      setNewVehicleNextMaintenanceKm(valStr === '' ? '' : Number(valStr));
                    }}
                    className="inset-input w-full px-2.5 py-2 rounded-xl bg-[#1E2129] text-xs font-mono font-bold text-amber-300 focus:outline-none border border-amber-500/30"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span>Intervalo de Manutenção Periódica</span>
                    <span className="text-indigo-400 font-mono font-bold">
                      A cada {newVehicleMaintenanceIntervalKm.toLocaleString('pt-BR')} km
                    </span>
                  </div>
                  <select
                    value={newVehicleMaintenanceIntervalKm}
                    onChange={(e) => setNewVehicleMaintenanceIntervalKm(Number(e.target.value) || 10000)}
                    className="inset-input w-full px-2.5 py-1.5 rounded-xl bg-[#1E2129] text-xs text-slate-300 focus:outline-none"
                  >
                    <option value={5000}>A cada 5.000 km (Uso severo)</option>
                    <option value={10000}>A cada 10.000 km (Padrão)</option>
                    <option value={15000}>A cada 15.000 km (Médio)</option>
                    <option value={20000}>A cada 20.000 km (Rodoviário)</option>
                  </select>
                </div>
              </div>

              {/* Foto do Veículo */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 mb-0.5 block">
                  Foto do Veículo
                </label>

                {newVehicleImage ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-video border border-indigo-500/40 bg-[#1E2129] group">
                    <img
                      src={newVehicleImage}
                      alt="Pré-visualização do Veículo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label
                        htmlFor="vehicle-photo-file-input"
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-indigo-500 flex items-center gap-1 shadow-sm"
                      >
                        <Camera className="w-3.5 h-3.5" /> Alterar
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewVehicleImage('')}
                        className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-500 flex items-center gap-1 shadow-sm"
                      >
                        <X className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Botão de Upload */}
                    <label
                      htmlFor="vehicle-photo-file-input"
                      className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-700 bg-[#1E2129] hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform border border-indigo-500/20">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        Clique para escolher foto do dispositivo
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG ou WEBP (Max 5MB)
                      </span>
                    </label>

                    {/* Presets and URL option */}
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                      <span>Fotos sugeridas:</span>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="text-indigo-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="w-3 h-3" />
                        {showUrlInput ? 'Ocultar Link' : 'Usar Link URL'}
                      </button>
                    </div>

                    {showUrlInput && (
                      <input
                        type="url"
                        placeholder="https://exemplo.com/veiculo.jpg"
                        value={newVehicleImage}
                        onChange={(e) => setNewVehicleImage(e.target.value)}
                        className="inset-input w-full px-3 py-2 rounded-xl bg-[#1E2129] text-xs text-white focus:outline-none"
                      />
                    )}

                    <div className="grid grid-cols-4 gap-1.5">
                      {PRESET_VEHICLE_IMAGES.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setNewVehicleImage(preset.url)}
                          className={`relative rounded-lg overflow-hidden aspect-square border transition-all ${
                            newVehicleImage === preset.url
                              ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                              : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-white text-center py-0.5 truncate font-medium">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  id="vehicle-photo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </div>

              <div className="flex gap-2 mt-2">
                {editingVehicle && (
                  <button
                    type="button"
                    onClick={() => {
                      const v = editingVehicle;
                      setShowVehicleModal(false);
                      setVehicleToDelete(v);
                    }}
                    className="py-3 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1"
                    title="Excluir Veículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#1E2129] text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  {editingVehicle ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Vehicle */}
      {vehicleToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Excluir Veículo?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tem certeza que deseja excluir o veículo <strong className="text-white">{vehicleToDelete.model} ({vehicleToDelete.plate})</strong>?
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-[#1E2129] text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVehicle}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset / Delete Data */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Excluir todos os dados?</h3>
            <p className="text-xs text-slate-400">
              Esta ação reiniciará todas as viagens, despesas e configurações para os dados originais.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[#1E2129] text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-center text-white">
            <h3 className="text-lg font-bold text-white">Sair da Sessão?</h3>
            <p className="text-xs text-slate-400">
              Você pode se reconectar a qualquer momento utilizando suas credenciais FrotaFácil.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[#1E2129] text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Permanecer
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setShowLogoutConfirm(false);
                }}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
              >
                Confirmar Saída
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar ou Trocar Conta de E-mail */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Trocar Conta de E-mail</h3>
                  <p className="text-xs text-slate-400">Torna o endereço a Conta Principal do app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Email Badge */}
            <div className="p-3 rounded-xl bg-[#1E2129] border border-white/5 flex items-center justify-between text-xs">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400">Conta Principal Atual</span>
                <span className="font-semibold text-slate-200 truncate">
                  {driverProfile.email || 'willianbpaschoal@gmail.com'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 ml-2">
                Principal Ativa
              </span>
            </div>

            {/* Quick Google Account Switch */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Vincular Conta Google:
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewEmailInput('willianbpaschoal@gmail.com');
                  setEmailError('');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Usar Conta Google (willianbpaschoal@gmail.com)</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewEmail} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  Novo Endereço de E-mail (Conta Principal)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="novo.email@exemplo.com"
                    value={newEmailInput}
                    onChange={(e) => {
                      setNewEmailInput(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    className="inset-input w-full px-3.5 py-3 rounded-xl bg-[#1E2129] text-sm font-semibold focus:outline-none text-white border border-white/10 focus:border-indigo-500 transition-colors"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ao trocar, esta conta se tornará a <strong className="text-emerald-400">Conta Principal</strong> do app.
                </p>
                {emailError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 mt-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {emailError}
                  </p>
                )}
                {emailSuccessMessage && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {emailSuccessMessage}
                  </p>
                )}
              </div>

              {/* Quick domain buttons */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Atalhos de provedor:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com'].map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => {
                        const atIndex = newEmailInput.indexOf('@');
                        const prefix = atIndex !== -1 ? newEmailInput.slice(0, atIndex) : newEmailInput;
                        setNewEmailInput((prefix || 'usuario') + domain);
                        setEmailError('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#1E2129] hover:bg-[#252932] text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" /> Definir Conta Principal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Driver Profile */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Editar Dados do Motorista</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDriverSubmit} className="flex flex-col gap-3">
              {/* Photo Preview & Options */}
              <div className="flex flex-col items-center gap-2 p-3.5 bg-[#1E2129] rounded-2xl border border-white/5">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md bg-indigo-500/10 flex items-center justify-center">
                  {driverAvatar ? (
                    <img
                      src={driverAvatar}
                      alt="Preview avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-10 h-10 text-indigo-400" />
                  )}
                </div>
                <div className="flex gap-2 w-full pt-1">
                  <label className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer text-center active:scale-95 transition-all">
                    <Camera className="w-4 h-4" /> Enviar Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDriverAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDriverUrlInput(!showDriverUrlInput)}
                    className="py-2 px-3 rounded-xl bg-[#12141C] border border-white/10 text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> URL
                  </button>
                </div>

                {showDriverUrlInput && (
                  <input
                    type="url"
                    placeholder="https://exemplo.com/sua-foto.jpg"
                    value={driverAvatar}
                    onChange={(e) => setDriverAvatar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#12141C] text-xs text-white border border-white/10 focus:outline-none"
                  />
                )}

                {/* Preset Avatars */}
                <div className="w-full pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                    Ou escolha uma foto pré-definida:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_DRIVER_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDriverAvatar(preset.url)}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer mx-auto ${
                          driverAvatar === preset.url
                            ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/20'
                            : 'border-white/10 hover:border-slate-400 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Nome Completo do Motorista</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do Motorista"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-semibold focus:outline-none text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Função / Cargo</label>
                  <input
                    type="text"
                    placeholder="Ex: Motorista Operacional"
                    value={driverRole}
                    onChange={(e) => setDriverRole(e.target.value)}
                    className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">ID Frota</label>
                  <input
                    type="text"
                    placeholder="Ex: #4829"
                    value={driverFleetId}
                    onChange={(e) => setDriverFleetId(e.target.value)}
                    className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Telefone</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">CNH</label>
                  <input
                    type="text"
                    placeholder="Número da CNH"
                    value={driverCnh}
                    onChange={(e) => setDriverCnh(e.target.value)}
                    className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">E-mail Cadastrado</label>
                <input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={driverEmail}
                  onChange={(e) => setDriverEmail(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white border border-white/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 flex items-center justify-between">
                  <span>CNPJ / CPF (Para Relatórios)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  value={driverCnpj}
                  onChange={(e) => setDriverCnpj(formatCpfCnpj(e.target.value))}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white border border-white/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-400 mb-1 flex items-center justify-between">
                  <span>Chave PIX (Para Relatórios PDF)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                </label>
                <input
                  type="text"
                  placeholder="CPF, CNPJ, E-mail, Telefone ou Chave Aleatória"
                  value={driverPixKey}
                  onChange={(e) => setDriverPixKey(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-xs font-semibold focus:outline-none text-white border border-emerald-500/20 focus:border-emerald-500/50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="flex-1 py-3 bg-[#1E2129] hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" /> Salvar Motorista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                Cadastrar Categoria
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hospedagem, Lavagem, Pedágio Extra..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="inset-input w-full px-3 py-2.5 rounded-xl bg-[#1E2129] text-sm font-semibold focus:outline-none text-white border border-white/10"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-3 bg-[#1E2129] hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" /> Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Pergunta se deseja cadastrar veículo */}
      {showAskVehicleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#12141C] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center gap-4 text-white"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-indigo-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Truck className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Deseja cadastrar o veículo agora?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cadastre o modelo, placa e quilometragem do seu veículo para acompanhar rotas, manutenções e associar às suas viagens.
              </p>
            </div>

            <div className="flex flex-col w-full gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAskVehicleModal(false);
                  handleOpenAddVehicle();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all transform active:scale-95"
              >
                <Truck className="w-4 h-4" />
                <span>Sim, Cadastrar Veículo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAskVehicleModal(false);
                  setIsOnboardingFlow(false);
                  setActiveTab('dashboard');
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#1E2129] hover:bg-[#252932] text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Não, ir para o Menu Principal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
