import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Bell, Database, Check, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  appColor: string;
  setAppColor: (color: string) => void;
  defaultPriority: string;
  setDefaultPriority: (priority: string) => void;
  enableAlerts: boolean;
  setEnableAlerts: (enable: boolean) => void;
}

const APP_COLORS = [
  { id: 'blue', name: 'Azul Moderno', class: 'bg-blue-600', color: '#3b82f6' },
  { id: 'indigo', name: 'Indigo Corporativo', class: 'bg-indigo-600', color: '#4f46e5' },
  { id: 'emerald', name: 'Esmeralda Ágil', class: 'bg-emerald-600', color: '#059669' },
  { id: 'purple', name: 'Purpura Creativo', class: 'bg-purple-600', color: '#7c3aed' },
  { id: 'rose', name: 'Rosa Vibrante', class: 'bg-rose-600', color: '#e11d48' },
];

export default function SettingsModal({
  isOpen,
  onClose,
  onResetData,
  appColor,
  setAppColor,
  defaultPriority,
  setDefaultPriority,
  enableAlerts,
  setEnableAlerts,
}: SettingsModalProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleReset = () => {
    if (confirm('⚠️ ¿Estás completamente seguro de restablecer el sistema? Esto eliminará todos los entregables, clientes personalizados y comentarios cargados, volviendo a la simulación inicial.')) {
      onResetData();
      setSuccessMsg('¡Datos restablecidos con éxito!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          id="settings-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Configuración del Sistema</h3>
                <p className="text-xs text-slate-400">Personaliza tu entorno de seguimiento y control</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center animate-bounce">
                ✅ {successMsg}
              </div>
            )}

            {/* Tema visual del sistema */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Palette className="w-4 h-4 text-slate-400" />
                Color de Acento del Sistema
              </label>
              <p className="text-[11px] text-slate-400 font-medium">Configura la tonalidad primaria para botones y elementos activos del panel de control.</p>
              <div className="grid grid-cols-2 gap-2">
                {APP_COLORS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => {
                      setAppColor(col.color);
                      setSuccessMsg(`Tonalidad cambiada a ${col.name}`);
                      setTimeout(() => setSuccessMsg(null), 1200);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      appColor === col.color
                        ? 'border-blue-500 bg-blue-50/20 text-blue-800'
                        : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${col.class}`} />
                    <span>{col.name}</span>
                    {appColor === col.color && <Check className="w-3.5 h-3.5 text-blue-600 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Configuración de Preferencias */}
            <div className="space-y-4 pt-4 border-t border-slate-150">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Shield className="w-4 h-4 text-slate-400" />
                Planificación Automatizada
              </label>

              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-700">Prioridad por Defecto</span>
                  <span className="text-[11px] text-slate-400 font-medium">Prioridad asignada automáticamente al registrar un nuevo hito mensual.</span>
                  <div className="flex gap-2">
                    {['Alta', 'Media', 'Baja'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setDefaultPriority(p);
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          defaultPriority === p
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Alertas y Notificaciones */}
            <div className="space-y-3 pt-4 border-t border-slate-150">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Bell className="w-4 h-4 text-slate-400" />
                Alertas del Muro y Seguimiento
              </label>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-150">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Notificaciones de Tiempo Real</span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Alertas visuales instantáneas al recibir aprobaciones o comentarios.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableAlerts(!enableAlerts)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                    enableAlerts ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>

            {/* Mantenimiento de Datos */}
            <div className="space-y-3 pt-4 border-t border-slate-150">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-rose-500">
                <Database className="w-4 h-4" />
                Mantenimiento de Datos (Peligro)
              </label>
              <p className="text-[11px] text-slate-400 font-medium">¿Deseas vaciar la caché y restablecer el simulador con sus datos de demostración de fábrica?</p>
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                ⚠️ Restablecer Toda la Base de Datos
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Listo, Guardar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
