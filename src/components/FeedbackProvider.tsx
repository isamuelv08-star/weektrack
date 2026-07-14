import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface AlertOptions {
  title: string;
  message: string;
  buttonText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  onClose?: () => void;
}

interface FeedbackContextType {
  showToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  showConfirm: (options: ConfirmOptions) => void;
  showAlert: (title: string, message: string, type?: 'info' | 'warning' | 'error' | 'success', onClose?: () => void) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback debe usarse dentro de un FeedbackProvider');
  }
  return context;
}

export default function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [alertState, setAlertState] = useState<{
    options: AlertOptions;
    isOpen: boolean;
  } | null>(null);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    const newToast: Toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmState(options);
  };

  const showAlert = (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    onClose?: () => void
  ) => {
    setAlertState({
      options: { title, message, type, onClose },
      isOpen: true,
    });
  };

  const handleConfirmAction = () => {
    if (confirmState) {
      confirmState.onConfirm();
      setConfirmState(null);
    }
  };

  const handleCancelAction = () => {
    if (confirmState) {
      if (confirmState.onCancel) confirmState.onCancel();
      setConfirmState(null);
    }
  };

  const handleAlertClose = () => {
    if (alertState) {
      if (alertState.options.onClose) alertState.options.onClose();
      setAlertState(null);
    }
  };

  return (
    <FeedbackContext.Provider value={{ showToast, showConfirm, showAlert }}>
      {children}

      {/* --- NOTIFICACIONES TOAST CENTRADAS EN LA PARTE SUPERIOR/CENTRAL --- */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 items-center w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            let icon = <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
            let bgClass = 'bg-slate-900/95 border-slate-800/80';
            let textClass = 'text-slate-100';
            let glowClass = 'shadow-emerald-500/10 border-emerald-500/20';

            if (toast.type === 'error') {
              icon = <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
              glowClass = 'shadow-rose-500/10 border-rose-500/20';
            } else if (toast.type === 'warning') {
              icon = <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
              glowClass = 'shadow-amber-500/10 border-amber-500/20';
            } else if (toast.type === 'info') {
              icon = <Info className="w-4 h-4 text-blue-500 shrink-0" />;
              glowClass = 'shadow-blue-500/10 border-blue-500/20';
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border ${bgClass} ${glowClass} shadow-xl max-w-full`}
              >
                {icon}
                <span className={`text-[11.5px] font-bold ${textClass} leading-snug tracking-wide`}>
                  {toast.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* --- VENTANAS DE CONFIRMACIÓN MINIMALISTAS Y CENTRADAS --- */}
      <AnimatePresence>
        {confirmState && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative p-6"
            >
              {/* Icon Circle */}
              <div className="flex items-center justify-center mb-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  confirmState.type === 'danger' 
                    ? 'bg-rose-500/10 text-rose-400' 
                    : 'bg-indigo-500/10 text-indigo-400'
                }`}>
                  {confirmState.type === 'danger' ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <HelpCircle className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Text */}
              <div className="text-center space-y-1.5 mb-6">
                <h3 className="text-sm font-black text-slate-100 tracking-tight">
                  {confirmState.title}
                </h3>
                <p className="text-[11.5px] text-slate-400 font-medium leading-relaxed">
                  {confirmState.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelAction}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {confirmState.cancelText || 'Cancelar'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`flex-1 py-2.5 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    confirmState.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/10'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/10'
                  }`}
                >
                  {confirmState.confirmText || 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DIÁLOGOS DE ALERTA MINIMALISTAS Y CENTRADOS --- */}
      <AnimatePresence>
        {alertState && alertState.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative p-6"
            >
              {/* Icon Circle */}
              <div className="flex items-center justify-center mb-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  alertState.options.type === 'error'
                    ? 'bg-rose-500/10 text-rose-400'
                    : alertState.options.type === 'warning'
                    ? 'bg-amber-500/10 text-amber-400'
                    : alertState.options.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {alertState.options.type === 'error' ? (
                    <XCircle className="w-5 h-5" />
                  ) : alertState.options.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : alertState.options.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Text */}
              <div className="text-center space-y-1.5 mb-6">
                <h3 className="text-sm font-black text-slate-100 tracking-tight">
                  {alertState.options.title}
                </h3>
                <p className="text-[11.5px] text-slate-400 font-medium leading-relaxed">
                  {alertState.options.message}
                </p>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={handleAlertClose}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-blue-600/10"
              >
                {alertState.options.buttonText || 'Entendido'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FeedbackContext.Provider>
  );
}
