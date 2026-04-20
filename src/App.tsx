/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Timer, CheckCircle, RotateCcw, Info, Settings } from 'lucide-react';

// Help functions for time manipulation
const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatDuration = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};

export default function App() {
  const [now, setNow] = useState(minutesToTime(new Date().getHours() * 60 + new Date().getMinutes()));
  const [cycleDuration, setCycleDuration] = useState("02:30");
  const [targetFinish, setTargetFinish] = useState("08:00");
  const [result, setResult] = useState<{
    suggestedDelay: number;
    exactDelay: number;
    actualFinish: string;
    gap: number;
  } | null>(null);

  // Available steps for the washing machine
  const getAvailableSteps = () => {
    const steps: number[] = [];
    // 30min steps from 0.5 to 10h
    for (let i = 0.5; i <= 10; i += 0.5) {
      steps.push(i);
    }
    // 1h steps from 11h to 24h
    for (let i = 11; i <= 24; i += 1) {
      steps.push(i);
    }
    return steps;
  };

  const calculate = () => {
    const currentMins = timeToMinutes(now);
    const cycleMins = timeToMinutes(cycleDuration);
    let targetMins = timeToMinutes(targetFinish);

    // If target is before or same as current, assume it's for the next day
    if (targetMins <= currentMins) {
      targetMins += 24 * 60;
    }

    // Delay = Target - Now - Cycle
    const exactDelayMins = targetMins - currentMins - cycleMins;
    const exactDelayHours = exactDelayMins / 60;

    if (exactDelayHours < 0) {
      // If cycle is longer than available time until target finish
      setResult(null);
      return;
    }

    const steps = getAvailableSteps();
    
    // Find the closest step that is <= exactDelayHours (or just closest)
    // Most users prefer not wasting too much time, but also not finishing late.
    // Let's find the step that minimizes the difference.
    let bestStep = steps[0];
    let minDiff = Math.abs(exactDelayHours - steps[0]);

    for (const step of steps) {
      const diff = Math.abs(exactDelayHours - step);
      if (diff < minDiff) {
        minDiff = diff;
        bestStep = step;
      }
    }

    // Actual finish time with bestStep
    const actualFinishMins = currentMins + (bestStep * 60) + cycleMins;
    
    setResult({
      suggestedDelay: bestStep,
      exactDelay: exactDelayHours,
      actualFinish: minutesToTime(actualFinishMins),
      gap: (actualFinishMins - targetMins)
    });
  };

  useEffect(() => {
    calculate();
  }, [now, cycleDuration, targetFinish]);

  const resetToCurrentTime = () => {
    const d = new Date();
    setNow(minutesToTime(d.getHours() * 60 + d.getMinutes()));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl p-6 md:p-12 flex flex-col items-center">
        
        {/* Header */}
        <header className="w-full flex justify-between items-end mb-12 border-b border-zinc-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-light tracking-tight">Programmateur <span className="text-indigo-400 font-medium">Lave-Linge</span></h1>
            <p className="text-zinc-500 text-sm">Calculateur de départ différé intelligent</p>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Version Logique</div>
            <div className="font-mono text-xs text-zinc-400">v2.4.0-STABLE</div>
          </div>
        </header>

        <main className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
          
          {/* Inputs Section */}
          <div className="md:col-span-5 space-y-8">
            <section className="space-y-6">
              
              {/* Current Time */}
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-zinc-400">Heure actuelle</label>
                  <button 
                    onClick={resetToCurrentTime}
                    className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Actualiser
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="time" 
                    value={now}
                    onChange={(e) => setNow(e.target.value)}
                    className="glass-input text-2xl font-light"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Cycle duration */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-400 ml-1">Durée du cycle de lavage</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={cycleDuration}
                    onChange={(e) => setCycleDuration(e.target.value)}
                    className="glass-input text-xl font-light"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                    <Timer className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Target Finish */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-400 ml-1">Heure de fin souhaitée</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={targetFinish}
                    onChange={(e) => setTargetFinish(e.target.value)}
                    className="glass-input text-2xl font-light border-indigo-500/30"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400/50 pointer-events-none">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </section>

            {/* Step badges */}
            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Rappel des paliers</h4>
              <div className="flex flex-wrap gap-2">
                <span className="step-badge">0h - 10h : Pas de 30m</span>
                <span className="step-badge">10h - 24h : Pas de 1h</span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="md:col-span-7 flex flex-col h-full min-h-[400px]">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8 md:p-10 card-glow flex flex-col justify-between items-center text-center backdrop-blur-sm"
                >
                  <div className="space-y-2">
                    <span className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em]">Réglage suggéré</span>
                    <h2 className="text-zinc-500 text-sm">Configurez votre machine sur :</h2>
                  </div>

                  <div className="flex flex-col items-center justify-center my-8">
                    <div className="text-[100px] md:text-[120px] font-extralight tracking-tighter leading-none text-white flex items-baseline">
                      {Math.floor(result.suggestedDelay)}
                      <span className="text-indigo-500 font-normal text-6xl md:text-8xl">h</span>
                      {Math.round((result.suggestedDelay % 1) * 60) > 0 && (
                        <span className="text-white">{(result.suggestedDelay % 1 * 60).toString().padStart(2, '0')}</span>
                      )}
                    </div>
                    
                    <div className="mt-4 h-1 w-32 bg-indigo-500/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "66%" }}
                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 w-full gap-4 border-t border-zinc-800 pt-8">
                    <div className="text-left">
                      <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Démarrage prévu</div>
                      <div className="text-lg font-medium text-zinc-300">
                        {minutesToTime((timeToMinutes(now) + result.suggestedDelay * 60) % (24 * 60))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Fin réelle</div>
                      <div className="text-lg font-medium text-zinc-300">{result.actualFinish}</div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[32px] p-10 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <Timer className="w-12 h-12 text-zinc-700" />
                  <p className="text-sm font-medium text-zinc-500 leading-relaxed max-w-[200px]">
                    Impossible de calculer : le cycle est trop long pour l'heure de fin choisie.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 px-4 flex items-center justify-between text-[10px] text-zinc-600 leading-relaxed uppercase tracking-wide">
              <p>Note : Le réglage a été ajusté selon les paliers de votre machine pour une gestion optimale.</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-zinc-800 pt-6 mt-12 text-zinc-500 underline-offset-4 flex flex-col md:flex-row justify-between items-center text-[11px] uppercase tracking-widest gap-4">
          <div>Logiciel de gestion domestique</div>
          <div className="flex items-center gap-2">
            Propulsé par Tailwind CSS <span className="text-zinc-800">•</span> 2026
          </div>
        </footer>
      </div>
    </div>
  );
}
