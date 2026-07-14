import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Bell, Database, Check, Palette, Mail, Lock, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { useFeedback } from './FeedbackProvider';


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
  activeUserEmail: string;
  onUpdateEmail: (email: string) => void;
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
  activeUserEmail,
  onUpdateEmail,
}: SettingsModalProps) {
  const { showConfirm, showToast } = useFeedback();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState(activeUserEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [customShareDomain, setCustomShareDomain] = useState(() => localStorage.getItem('wt_custom_share_domain') || '');

  useEffect(() => {
    setNewEmail(activeUserEmail);
  }, [activeUserEmail]);

  const handleUpdateEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim()
      });
      if (error) {
        setEmailError(error.message);
        return;
      }
      setEmailSuccess('¡Correo actualizado! Revisa los enlaces de confirmación enviados a tu antiguo y nuevo correo.');
    } else {
      onUpdateEmail(newEmail.trim());
      setEmailSuccess('¡Correo electrónico actualizado con éxito!');
    }
    setTimeout(() => setEmailSuccess(null), 4000);
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (!newPassword) {
      setPasswordError('La contraseña no puede estar vacía.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        setPasswordError(error.message);
        return;
      }
      setPasswordSuccess('¡Contraseña actualizada con éxito en Supabase!');
    } else {
      sessionStorage.setItem('wt_simulated_password_updated', 'true');
      setPasswordSuccess('¡Contraseña actualizada con éxito!');
    }
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(null), 3000);
  };

  const handleReset = () => {
    showConfirm({
      title: '¿Restablecer el sistema?',
      message: '⚠️ ¿Estás completamente seguro de restablecer el sistema? Esto eliminará todos los entregables, clientes personalizados y comentarios cargados, volviendo a la simulación inicial.',
      confirmText: 'Sí, restablecer',
      cancelText: 'Cancelar',
      type: 'danger',
      onConfirm: () => {
        onResetData();
        showToast('¡Datos restablecidos con éxito!', 'success');
        onClose();
      }
    });
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

            {/* Dominio de Enlace de Compartición */}
            <div className="space-y-3 pt-4 border-t border-slate-150">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Globe className="w-4 h-4 text-slate-400" />
                Dominio de Enlace de Compartición
              </label>
              <p className="text-[11px] text-slate-400 font-medium">
                Por defecto, los enlaces compartidos usan el dominio de la pestaña actual. Si estás hospedando tu app en un dominio de producción (ej: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">https://mitrabajo.com</code>), configúralo aquí para que los enlaces se generen correctamente.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={customShareDomain}
                  onChange={(e) => {
                    setCustomShareDomain(e.target.value);
                    localStorage.setItem('wt_custom_share_domain', e.target.value);
                  }}
                  placeholder="https://mi-weektrack-app.com"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold placeholder-slate-400 focus:border-blue-500/80 outline-none"
                />
                {customShareDomain && (
                  <span className="text-[10px] text-emerald-600 font-bold block">
                    ✓ Enlaces generados apuntarán a: {customShareDomain.replace(/\/$/, '')}/?company=...
                  </span>
                )}
              </div>
            </div>

            {/* Ajustes de Cuenta (Modificar Correo y Contraseña) */}
            <div className="space-y-4 pt-4 border-t border-slate-150">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Settings className="w-4 h-4 text-slate-400" />
                Ajustes de Cuenta (Seguridad)
              </label>
              
              {/* Formulario de Cambio de Correo */}
              <form onSubmit={handleUpdateEmailSubmit} className="space-y-2 bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                <span className="text-xs font-bold text-slate-700 block">Actualizar Correo Electrónico</span>
                {emailSuccess && (
                  <div className="p-2 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-lg text-[11px] font-bold">
                    {emailSuccess}
                  </div>
                )}
                {emailError && (
                  <div className="p-2 bg-rose-50 border border-rose-150 text-rose-800 rounded-lg text-[11px] font-bold">
                    {emailError}
                  </div>
                )}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setEmailError(null);
                    }}
                    placeholder="nuevo@correo.com"
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold placeholder-slate-400 focus:border-blue-500/80 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: appColor }}
                  className="w-full py-1.5 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  Guardar Nuevo Correo
                </button>
              </form>

              {/* Formulario de Cambio de Contraseña */}
              <form onSubmit={handleUpdatePasswordSubmit} className="space-y-2 bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                <span className="text-xs font-bold text-slate-700 block">Cambiar Contraseña</span>
                {passwordSuccess && (
                  <div className="p-2 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-lg text-[11px] font-bold">
                    {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div className="p-2 bg-rose-50 border border-rose-150 text-rose-800 rounded-lg text-[11px] font-bold">
                    {passwordError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      placeholder="Nueva contraseña"
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold placeholder-slate-400 focus:border-blue-500/80 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      placeholder="Confirmar contraseña"
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold placeholder-slate-400 focus:border-blue-500/80 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  style={{ backgroundColor: appColor }}
                  className="w-full py-1.5 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  Actualizar Contraseña
                </button>
              </form>
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
