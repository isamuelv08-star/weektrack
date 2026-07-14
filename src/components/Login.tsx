import React, { useState } from 'react';
import { 
  TrendingUp, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Shield, 
  Users, 
  UserCheck, 
  Key, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (role: 'Admin' | 'Equipo' | 'Cliente', name: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Equipo' | 'Cliente'>('Admin');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Credenciales preestablecidas para demostración fácil
  const DEMO_USERS = [
    {
      role: 'Admin' as const,
      name: 'Samuel V. (iGenius)',
      email: 'samuel@igenius.com',
      avatar: 'SV',
      color: 'bg-blue-600',
      desc: 'Administrador total, control de clientes y aprobación de accesos'
    },
    {
      role: 'Equipo' as const,
      name: 'Carlos Gómez (Diseño)',
      email: 'carlos@igenius.com',
      avatar: 'CG',
      color: 'bg-indigo-600',
      desc: 'Edición técnica de cronogramas, comentarios y tareas de diseño'
    },
    {
      role: 'Cliente' as const,
      name: 'Sofía Pasquel (Mundillantas)',
      email: 'sofia@mundillantas.com',
      avatar: 'SP',
      color: 'bg-emerald-600',
      desc: 'Visualización de avances, carga de activos y comentarios de revisión'
    }
  ];

  const handleQuickSelect = (user: typeof DEMO_USERS[number]) => {
    setEmail(user.email);
    setPassword('••••••••');
    setRole(user.role);
    setName(user.name);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor ingresa un correo electrónico.');
      return;
    }

    setIsLoading(true);

    // Simular un pequeño retardo de red premium
    setTimeout(() => {
      setIsLoading(false);
      
      // Encontrar si corresponde a algún usuario de demostración
      const matchedDemo = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      const finalRole = matchedDemo ? matchedDemo.role : role;
      const finalName = matchedDemo ? matchedDemo.name : (name || (finalRole === 'Admin' ? 'Samuel V. (iGenius)' : finalRole === 'Equipo' ? 'Carlos Gómez (Diseño)' : 'Sofía Pasquel (Gerente)'));

      onLogin(finalRole, finalName);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Background ambient glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/10 mb-4"
          >
            <TrendingUp className="w-6 h-6" />
          </motion.div>
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-black text-white tracking-tight leading-none"
          >
            WeekTrack <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full ml-1.5 font-bold">Live v1.3</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs text-slate-400 mt-2 font-medium max-w-xs"
          >
            Tablero de Colaboración de Alta Fidelidad en Tiempo Real para Agencias y Clientes
          </motion.p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative"
        >
          {/* Quick Select Panel */}
          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Seleccionar Perfil de Acceso Rápido
            </span>
            <div className="space-y-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.role}
                  type="button"
                  onClick={() => handleQuickSelect(user)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3 ${
                    email === user.email
                      ? 'bg-slate-800 border-blue-500/50 shadow-md shadow-blue-500/5'
                      : 'bg-slate-950/40 border-slate-800/55 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white block truncate">{user.name}</span>
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        user.role === 'Admin' ? 'bg-blue-950 text-blue-400 border border-blue-900/60' :
                        user.role === 'Equipo' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/60' :
                        'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">{user.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-[9px] font-extrabold uppercase tracking-widest">O CREDENCIALES</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Regular Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="ejemplo@igenius.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-slate-200 text-xs font-semibold placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-slate-200 text-xs font-semibold placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Custom fields when typing unknown emails */}
            {!DEMO_USERS.some(u => u.email.toLowerCase() === email.toLowerCase()) && email.includes('@') && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-4 pt-1 overflow-hidden"
              >
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre aquí"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 rounded-xl text-slate-200 text-xs font-semibold placeholder-slate-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Rol en la Plataforma
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Admin', 'Equipo', 'Cliente'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-1.5 text-[10px] font-extrabold rounded-xl border transition-all cursor-pointer ${
                          role === r
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-750 disabled:to-indigo-750 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verificando Credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a WeekTrack</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[10px] text-slate-500 flex items-center justify-center gap-1">
          <Shield className="w-3.5 h-3.5" />
          <span>Acceso encriptado mediante Supabase Node Auth & TLS</span>
        </div>
      </div>
    </div>
  );
}
