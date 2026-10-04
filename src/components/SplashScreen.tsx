import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Sparkles } from 'lucide-react';
import { ParticleBackground } from '@/registry/pioneerui/particle-background';

interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDurationMs = 2000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.floor((elapsed / minDurationMs) * 100));
      setProgress(currentProgress);

      if (elapsed >= minDurationMs) {
        clearInterval(interval);
        setTimeout(() => {
          setIsVisible(false);
          if (onFinish) onFinish();
        }, 200);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [minDurationMs, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, transition: { duration: 0.5, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0B] text-white select-none overflow-hidden"
        >
          {/* Particle Background */}
          <ParticleBackground
            particleCount={100}
            preset="links"
            color="#00FFE1"
            speed={2}
          />

          {/* Subtle background glow */}
          <div className="absolute w-[340px] h-[340px] bg-indigo-600/15 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-sm px-6 w-full text-center">
            
            {/* Animated Car Container */}
            <div className="relative w-48 h-24 mb-6 flex items-center justify-center">
              
              {/* Road line with moving dashes */}
              <div className="absolute bottom-2 left-0 right-0 h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: [-40, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
                  className="w-[140%] h-full flex gap-2"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-4 h-full bg-indigo-500/50 rounded-full shrink-0" />
                  ))}
                </motion.div>
              </div>

              {/* Driving Car / Van Icon with suspension bounce & slight tilt */}
              <motion.div
                animate={{
                  y: [0, -4, 0, -2, 0],
                  rotate: [0, -1, 1, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  ease: 'easeInOut',
                }}
                className="relative z-10 p-3.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl shadow-2xl shadow-indigo-500/40 border border-indigo-400/30 text-white"
              >
                <Truck className="w-10 h-10 stroke-[2]" />
                
                {/* Headlight beam effect */}
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-10 h-8 bg-gradient-to-r from-amber-300/40 to-transparent blur-xs pointer-events-none rounded-r-full" />
              </motion.div>

              {/* Wind / Speed lines behind the car */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-60">
                <motion.div
                  animate={{ opacity: [0.2, 1, 0.2], x: [0, -15] }}
                  transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
                  className="w-6 h-0.5 bg-indigo-400 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.2, 1, 0.2], x: [0, -20] }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut', delay: 0.1 }}
                  className="w-10 h-0.5 bg-indigo-300 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.2, 1, 0.2], x: [0, -12] }}
                  transition={{ repeat: Infinity, duration: 0.4, ease: 'easeInOut', delay: 0.2 }}
                  className="w-5 h-0.5 bg-indigo-400 rounded-full"
                />
              </div>
            </div>

            {/* Brand Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-2 mb-1"
            >
              <h1 className="text-2xl font-black tracking-tight text-white">
                Frota<span className="text-indigo-400">Fácil</span>
              </h1>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                v1.8.8
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs text-slate-400 mb-6 flex items-center justify-center gap-1.5 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              Iniciando sistema de gestão de frota...
            </motion.p>

            {/* Progress Bar Container */}
            <div className="w-48 bg-slate-800/80 p-1 rounded-full border border-white/10 shadow-inner mb-2">
              <div
                className="h-2 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-75 shadow-sm shadow-indigo-500/50"
                style={{ width: `${progress}%` }}
              />
            </div>

            <span className="text-[10px] font-mono font-semibold text-slate-500">
              {progress}%
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
