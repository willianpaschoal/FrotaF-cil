import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { JobForm } from './components/JobForm';
import { JobList } from './components/JobList';
import { Expenses } from './components/Expenses';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { JobDetailModal } from './components/JobDetailModal';
import { SplashScreen } from './components/SplashScreen';
import { GoogleAuthScreen } from './components/GoogleAuthScreen';
import { Job } from './types';

function MainApp() {
  const { activeTab, setActiveTab, isAuthenticated } = useFleet();
  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [showSplash, setShowSplash] = useState(false);

  if (!isAuthenticated) {
    return <GoogleAuthScreen />;
  }

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onSelectJob={(job) => setSelectedJobForModal(job)}
            onOpenQuickAdd={() => setActiveTab('job_form')}
          />
        );
      case 'jobs':
        return <JobList onSelectJob={(job) => setSelectedJobForModal(job)} />;
      case 'job_form':
        return (
          <JobForm
            onSuccess={() => setActiveTab('dashboard')}
            onCancel={() => setActiveTab('dashboard')}
          />
        );
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports onSelectJob={(job) => setSelectedJobForModal(job)} />;
      case 'settings':
        return <Settings onReplaySplash={() => setShowSplash(true)} />;
      default:
        return (
          <Dashboard
            onSelectJob={(job) => setSelectedJobForModal(job)}
            onOpenQuickAdd={() => setActiveTab('job_form')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-100 antialiased font-sans selection:bg-indigo-500/30">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <Header />

      <main className="w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full"
          >
            {renderCurrentTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />

      {selectedJobForModal && (
        <JobDetailModal
          job={selectedJobForModal}
          onClose={() => setSelectedJobForModal(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <FleetProvider>
      <MainApp />
    </FleetProvider>
  );
}
