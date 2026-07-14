import React from 'react';
import { 
  Lock, 
  ShieldAlert, 
  Radio, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { AccessRequest } from '../types';

interface AccessDeniedProps {
  role: 'Equipo' | 'Cliente';
  name: string;
  request: AccessRequest | null;
  onRequestAccess: () => void;
  onLogout: () => void;
}

export default function AccessDenied({ role, name, request, onRequestAccess, onLogout }: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md z-10 text-center">
        
        {/* Animated Icon Lock */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl ${
                !request ? 'bg-slate-800' :
                request.status === 'pending' ? 'bg-amber-600 shadow-amber-500/15' :
                'bg-red-600 shadow-red-500/15'
              }`}
            >
              {!request ? <Lock className="w-7 h-7" /> :
               request.status === 'pending' ? <Radio className="w-7 h-7 animate-pulse" /> :
               <ShieldAlert className="w-7 h-7" />}
            </motion.div>
            
            {request?.status === 'pending' && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            )}
          </div>
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl"
        >
          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
            role === 'Equipo' ? 'bg-indigo-950/60 text-indigo-400 border-indigo-900/55' : 'bg-emerald-950/60 text-emerald-400 border-emerald-900/55'
          }`}>
            Acceso {role === 'Equipo' ? 'Equipo Técnico' : 'Portal de Cliente'}
          </span>

          <h2 className="text-xl font-black text-white mt-4 tracking-tight">
            Hola, {name.split(' ')[0]}
          </h2>
          
          <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
            Estás intentando ingresar al tablero de WeekTrack, pero actualmente se requiere autorización de ingreso.
          </p>

          {/* Status render block */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-left">
            {!request ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-white block">Sin Solicitud Activa</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-normal">
                      Debes enviar una solicitud para que el Administrador te conceda permisos de edición y lectura.
                    </span>
                  </div>
                </div>
                <button
                  onClick={onRequestAccess}
                  className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Solicitar Acceso de Edición
                </button>
              </div>
            ) : request.status === 'pending' ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 block">Solicitud Enviada (Pendiente)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-normal">
                      Tu solicitud de ingreso fue enviada al líder <b>Samuel V. (Admin)</b> y se encuentra en revisión.
                    </span>
                  </div>
                </div>

                {/* Real-time sync instruction for testing */}
                <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">💡 Probando en Tiempo Real</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Puedes abrir <b>otra pestaña</b> o ventana del navegador con esta misma URL, ingresar como <b>Administrador</b> y verás la solicitud flotando en vivo para aprobarla al instante. ¡Pruébalo!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-red-400 block">Solicitud Rechazada</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-normal">
                      El Administrador ha denegado temporalmente tu solicitud de acceso a este cronograma.
                    </span>
                  </div>
                </div>
                <button
                  onClick={onRequestAccess}
                  className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer"
                >
                  Volver a Solicitar Acceso
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={onLogout}
              className="flex-1 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar Sesión
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-[10px] text-slate-600 mt-6 uppercase tracking-wider font-extrabold">
          WeekTrack Segurizado con Supabase Client Node
        </p>

      </div>
    </div>
  );
}
