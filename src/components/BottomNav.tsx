import React from 'react';
import { motion } from 'motion/react';
import { useFleet } from '../context/FleetContext';
import { TabType } from '../types';
import { LayoutDashboard, Truck, Wallet, BarChart3, Settings } from 'lucide-react';

interface NavItemConfig {
  id: TabType;
  label: string;
  icon: React.FC<{ className?: string }>;
  activeColor: string;
  activeBgGradient: string;
  activeBorder: string;
  activeGlow: string;
  indicatorGradient: string;
  hoverColor: string;
}

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useFleet();

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Painel',
      icon: LayoutDashboard,
      activeColor: 'text-cyan-400',
      activeBgGradient: 'from-cyan-500/20 via-cyan-500/10 to-transparent',
      activeBorder: 'border-cyan-400/40',
      activeGlow: 'rgba(6,182,212,0.35)',
      indicatorGradient: 'from-cyan-400 to-sky-400',
      hoverColor: 'hover:text-cyan-300',
    },
    {
      id: 'jobs',
      label: 'Trabalhos',
      icon: Truck,
      activeColor: 'text-indigo-400',
      activeBgGradient: 'from-indigo-500/20 via-indigo-500/10 to-transparent',
      activeBorder: 'border-indigo-400/40',
      activeGlow: 'rgba(99,102,241,0.35)',
      indicatorGradient: 'from-indigo-400 to-violet-400',
      hoverColor: 'hover:text-indigo-300',
    },
    {
      id: 'expenses',
      label: 'Despesas',
      icon: Wallet,
      activeColor: 'text-rose-400',
      activeBgGradient: 'from-rose-500/20 via-rose-500/10 to-transparent',
      activeBorder: 'border-rose-400/40',
      activeGlow: 'rgba(244,63,94,0.35)',
      indicatorGradient: 'from-rose-400 to-pink-400',
      hoverColor: 'hover:text-rose-300',
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
      activeColor: 'text-emerald-400',
      activeBgGradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
      activeBorder: 'border-emerald-400/40',
      activeGlow: 'rgba(16,185,129,0.35)',
      indicatorGradient: 'from-emerald-400 to-teal-400',
      hoverColor: 'hover:text-emerald-300',
    },
    {
      id: 'settings',
      label: 'Ajustes',
      icon: Settings,
      activeColor: 'text-amber-400',
      activeBgGradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
      activeBorder: 'border-amber-400/40',
      activeGlow: 'rgba(245,158,11,0.35)',
      indicatorGradient: 'from-amber-400 to-orange-400',
      hoverColor: 'hover:text-amber-300',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 px-2 sm:px-4 pb-3.5 pt-2 glass-nav border-t border-white/10 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.65)] bg-[#10121A]/95 backdrop-blur-xl text-white">
      <div className="max-w-lg mx-auto flex justify-around items-center relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (activeTab === 'job_form' && item.id === 'jobs');

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              whileTap={{ scale: 0.88 }}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors duration-200 cursor-pointer select-none group ${
                isActive
                  ? item.activeColor
                  : `text-slate-400 ${item.hoverColor}`
              }`}
            >
              {/* Active Tab Background Capsule & Lighting */}
              {isActive && (
                <>
                  {/* Glowing backdrop capsule with spring slide transition */}
                  <motion.div
                    layoutId="activeTabCapsule"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    style={{
                      boxShadow: `0 0 18px ${item.activeGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    }}
                    className={`absolute inset-0 rounded-xl bg-gradient-to-b ${item.activeBgGradient} border ${item.activeBorder}`}
                  />

                  {/* Top Glowing Indicator Line */}
                  <motion.div
                    layoutId="activeTabTopLine"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    style={{
                      boxShadow: `0 0 10px ${item.activeGlow}`,
                    }}
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-gradient-to-r ${item.indicatorGradient}`}
                  />
                </>
              )}

              {/* Icon with Floating Movement when Active */}
              <motion.div
                animate={
                  isActive
                    ? {
                        y: [0, -3.5, 0],
                        scale: 1.12,
                        transition: {
                          y: {
                            repeat: Infinity,
                            duration: 2.2,
                            ease: 'easeInOut',
                          },
                          scale: {
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                          },
                        },
                      }
                    : {
                        y: 0,
                        scale: 1,
                      }
                }
                className="relative z-10 flex items-center justify-center"
              >
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive ? 'stroke-[2.5px] drop-shadow-md' : 'stroke-[1.8px] opacity-80 group-hover:opacity-100'
                  }`}
                />
              </motion.div>

              {/* Label */}
              <motion.span
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`relative z-10 text-[11px] mt-0.5 tracking-tight whitespace-nowrap transition-all duration-200 ${
                  isActive ? 'font-bold' : 'font-medium opacity-80 group-hover:opacity-100'
                }`}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
