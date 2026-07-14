import React, { useState, useEffect } from 'react';
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
  Loader2,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Company } from '../types';

interface LoginProps {
  onLogin: (role: 'Admin' | 'Equipo' | 'Cliente', name: string, email: string, companyId?: string) => void;
  companies: Company[];
}

export default function Login({ onLogin, companies }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Equipo' | 'Cliente'>('Admin');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados del Link de Compartición Detectado
  const [linkedCompany, setLinkedCompany] = useState<Company | null>(null);
  const [linkedRole, setLinkedRole] = useState<'Cliente' | 'Equipo' | null>(null);
  const [expectedEmail, setExpectedEmail] = useState<string>('');
  const [expectedName, setExpectedName] = useState<string>('');

  // Credenciales preestablecidas de respaldo
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

  // Detectar link compartido y vincular inicio de sesión
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const companyParam = params.get('company');
    const roleParam = params.get('role');

    if (companyParam && roleParam) {
      // Buscar compañía por ID
      const comp = companies.find(c => c.id === companyParam);
      if (comp) {
        setLinkedCompany(comp);
        
        const isClient = roleParam.toLowerCase() === 'cliente';
        const isTeam = roleParam.toLowerCase() === 'equipo';
        
        if (isClient) {
          setLinkedRole('Cliente');
          setRole('Cliente');
          const resolvedEmail = comp.managerEmail || 'sofia@mundillantas.com';
          const resolvedName = comp.managerName || 'Sofía Pasquel (Gerente)';
          setExpectedEmail(resolvedEmail);
          setExpectedName(resolvedName);
          setEmail(resolvedEmail); // Pre-cargar para facilitarle la vida al cliente
        } else if (isTeam) {
          setLinkedRole('Equipo');
          setRole('Equipo');
          const resolvedEmail = comp.teamEmail || 'carlos@igenius.com';
          const resolvedName = comp.teamName || 'Carlos Gómez (Diseño)';
          setExpectedEmail(resolvedEmail);
          setExpectedName(resolvedName);
          setEmail(resolvedEmail); // Pre-cargar para facilitarle la vida al equipo
        }
      }
    }
  }, [companies]);

  const handleQuickSelect = (user: typeof DEMO_USERS[number]) => {
    setEmail(user.email);
    setPassword('••••••••');
    setRole(user.role);
    setName(user.name);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('Por favor ingresa un correo electrónico.');
      return;
    }
    if (!password) {
      setError('Por favor ingresa una contraseña.');
      return;
    }

    // Validación estricta si es un link compartido: El correo de inicio debe coincidir con la cuenta del enlace
    if (linkedCompany && linkedRole) {
      const formattedEmail = email.trim().toLowerCase();
      const targetExpected = expectedEmail.trim().toLowerCase();
      const isAdminEmail = formattedEmail === 'samuel@igenius.com'; // El admin puede entrar a cualquier link

      if (formattedEmail !== targetExpected && !isAdminEmail) {
        setError(`Acceso Restringido: El correo ingresado no coincide con la cuenta autorizada para esta empresa. Por favor, inicia sesión con: ${expectedEmail}`);
        return;
      }
    }

    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        // Iniciar sesión real en Supabase Auth
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          setError(signInError.message);
        } else if (data.user) {
          const meta = data.user.user_metadata || {};
          const finalRole = linkedRole || (meta.role as 'Admin' | 'Equipo' | 'Cliente') || 'Admin';
          const finalName = expectedName || meta.name || data.user.email?.split('@')[0] || 'Usuario';
          onLogin(finalRole, finalName, data.user.email || email, linkedCompany?.id);
        }
      } catch (err: any) {
        setError(err?.message || 'Ocurrió un error inesperado al conectar con Supabase.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Simular inicio de sesión en modo Demo
      setTimeout(() => {
        setIsLoading(false);
        
        const formattedEmail = email.trim().toLowerCase();
        const matchedDemo = DEMO_USERS.find(u => u.email.toLowerCase() === formattedEmail);
        
        const finalRole = linkedRole || (matchedDemo ? matchedDemo.role : role);
        const finalName = expectedName || (matchedDemo ? matchedDemo.name : (name || (finalRole === 'Admin' ? 'Samuel V. (iGenius)' : finalRole === 'Equipo' ? 'Carlos Gómez (Diseño)' : 'Sofía Pasquel (Gerente)')));
        const finalEmail = matchedDemo ? matchedDemo.email : email;

        onLogin(finalRole, finalName, finalEmail, linkedCompany?.id);
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Background ambient glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
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

        {/* Personalized Welcome Greeting Card from Shared Link */}
        {linkedCompany && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-5 bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-900/60 p-4 rounded-2xl text-center shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 text-blue-500/20">
              <Globe className="w-16 h-16" />
            </div>
            
            <span className="inline-block px-2.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-wider mb-2 border border-blue-500/30">
              Enlace de {linkedRole === 'Cliente' ? 'Gerente' : 'Equipo'} Detectado
            </span>
            <h3 className="text-sm font-black text-white leading-tight">
              ¡Hola, {expectedName}!
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">
              Te damos la bienvenida al panel oficial de <strong className="text-blue-400 font-extrabold">{linkedCompany.name}</strong>.
            </p>
            <p className="text-[10px] text-slate-400 mt-2 font-semibold">
              Por favor inicia sesión utilizando el correo autorizado:
              <br />
              <span className="text-white underline">{expectedEmail}</span>
            </p>
          </motion.div>
        )}

        {/* Main Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative"
        >
          {/* Sign In Only Header */}
          <div className="pb-3.5 border-b border-slate-800/60 mb-5">
            <h2 className="text-sm font-black text-slate-200 text-center tracking-wide uppercase">
              Iniciar Sesión
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-900/60 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-ping" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>{successMessage}</span>
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

          {/* Quick Demo select (Only visible if NOT using a restricted shared company link, to allow fast evaluation) */}
          {!linkedCompany && !isSupabaseConfigured && (
            <div className="mt-5 border-t border-slate-800/50 pt-4">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-2.5 text-center">
                Acceso Rápido de Evaluación (Modo Demostración)
              </span>
              <div className="space-y-2">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.role}
                    type="button"
                    onClick={() => handleQuickSelect(user)}
                    className="w-full p-2 bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all flex items-center gap-2.5 group cursor-pointer"
                  >
                    <div className={`w-7 h-7 ${user.color} rounded-lg text-[9.5px] font-black text-white flex items-center justify-center`}>
                      {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-300 group-hover:text-white transition-colors">{user.name}</span>
                        <span className="text-[8px] font-black uppercase text-indigo-400 bg-indigo-950/50 px-1 rounded">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[8.5px] text-slate-500 truncate">{user.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
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
