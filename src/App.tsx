import { useState, useEffect } from 'react';
import { Company, Task, TaskStatus, TaskPriority, TaskType } from './types';
import { INITIAL_COMPANIES, INITIAL_TASKS } from './initialData';

// Modales
import CompanyModal from './components/CompanyModal';
import TaskModal from './components/TaskModal';
import ReportModal from './components/ReportModal';
import SettingsModal from './components/SettingsModal';

// Vistas
import CalendarView from './components/CalendarView';
import KanbanView from './components/KanbanView';
import RoadmapView from './components/RoadmapView';
import TimelineView from './components/TimelineView';

// Iconos
import {
  Calendar,
  Layers,
  Map,
  Activity,
  Plus,
  Users,
  FileText,
  Search,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Settings,
  Share2,
  MessageSquare,
  Shield,
  UserCheck,
  Bell,
  ExternalLink,
  Menu,
  X,
  Check,
  User,
  Lock,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  // --- ESTADO PRINCIPAL ---
  const [companies, setCompanies] = useState<Company[]>(() => {
    const local = localStorage.getItem('cronograma_companies');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error('Error parsing companies from localStorage', e);
      }
    }
    return INITIAL_COMPANIES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const local = localStorage.getItem('cronograma_tasks');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error('Error parsing tasks from localStorage', e);
      }
    }
    
    // Si no hay tareas guardadas, inyectamos comentarios para la experiencia de colaboración en tiempo real
    const seeded = INITIAL_TASKS.map((t, index) => {
      const withComments: Task = { ...t };
      if (!withComments.comments) {
        withComments.comments = [];
      }
      if (index === 0) {
        withComments.comments = [
          { id: 'c-init-1', authorName: 'Sofía Pasquel', authorRole: 'Cliente', text: 'Excelente propuesta de parrilla. Me encanta el enfoque Growth Scaling para este mes de campaña.', timestamp: '10:30 AM - Hace 2 días' },
          { id: 'c-init-2', authorName: 'Samuel V.', authorRole: 'Admin', text: '¡Excelente Sofía! El equipo técnico de iGenius ya está estructurando los mockups y copys.', timestamp: '11:15 AM - Hace 2 días' }
        ];
      } else if (index === 1) {
        withComments.comments = [
          { id: 'c-init-3', authorName: 'Sofía Pasquel', authorRole: 'Cliente', text: '¿Podríamos agregar exclusión para competidores locales en la campaña de pauta?', timestamp: '09:15 AM - Hoy' },
          { id: 'c-init-4', authorName: 'Carlos Gómez', authorRole: 'Equipo', text: 'Entendido Sofía. Añadida la lista de exclusiones de palabras clave negativas.', timestamp: '10:00 AM - Hoy' }
        ];
      } else if (index === 2) {
        withComments.comments = [
          { id: 'c-init-5', authorName: 'Samuel V.', authorRole: 'Admin', text: 'Carlos, por favor verifica el retraso del disparador de bienvenida en ActiveCampaign antes de lanzar el automation.', timestamp: 'Ayer' }
        ];
      }
      return withComments;
    });
    return seeded;
  });

  // --- FILTROS Y NAVEGACIÓN ---
  const [activeTab, setActiveTab] = useState<'calendario' | 'kanban' | 'roadmap' | 'timeline' | 'colaboracion'>('calendario');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // --- ESTADO DE MODALES ---
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // --- CONFIGURACIONES DEL SISTEMA ---
  const [appColor, setAppColor] = useState<string>(() => localStorage.getItem('wt_app_color') || '#3b82f6');
  const [defaultPriority, setDefaultPriority] = useState<string>(() => localStorage.getItem('wt_default_priority') || 'Media');
  const [enableAlerts, setEnableAlerts] = useState<boolean>(() => localStorage.getItem('wt_enable_alerts') !== 'false');

  // --- ESTADOS DE COLABORACIÓN Y CONTROL DE ROLES ---
  const [activeUserRole, setActiveUserRole] = useState<'Admin' | 'Equipo' | 'Cliente'>(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'cliente' || roleParam === 'Cliente') return 'Cliente';
    if (roleParam === 'equipo' || roleParam === 'Equipo') return 'Equipo';
    return 'Admin';
  });

  const [activeUserName, setActiveUserName] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name');
    if (nameParam) return nameParam;
    if (activeUserRole === 'Cliente') return 'Sofía Pasquel (Gerente)';
    if (activeUserRole === 'Equipo') return 'Carlos Gómez (Diseño)';
    return 'Samuel V. (iGenius)';
  });

  const [copiedLink, setCopiedLink] = useState<string | boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [liveEvents, setLiveEvents] = useState<string[]>([
    '🟢 [10:14 AM] Samuel V. (Líder Admin) ha ingresado al tablero.',
    '🟢 [10:15 AM] Carlos Gómez (Diseño) se ha conectado al espacio de trabajo.',
    '👁️ [10:16 AM] Sofía Pasquel (Gerente de Mundillantas) está visualizando el Gantt.',
  ]);

  // Al montar, revisar si hay roles en la URL y configurar motor de eventos interactivos
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const companyParam = params.get('company');
    const nameParam = params.get('name');
    
    if (roleParam === 'cliente' || roleParam === 'Cliente') {
      setActiveUserRole('Cliente');
      if (companyParam) {
        setSelectedCompanyId(companyParam);
      }
      setActiveUserName(nameParam || 'Sofía Pasquel (Gerente)');
    } else if (roleParam === 'equipo' || roleParam === 'Equipo') {
      setActiveUserRole('Equipo');
      setActiveUserName(nameParam || 'Carlos Gómez (Diseño)');
    } else if (roleParam === 'admin' || roleParam === 'Admin') {
      setActiveUserRole('Admin');
      setActiveUserName(nameParam || 'Samuel V. (Admin)');
    }

    const events = [
      'Sofía Pasquel (Gerente de Mundillantas) ha visualizado la vista Gantt.',
      'Carlos Gómez (Diseño) actualizó el checklist de "Diseño de Carruseles" para Austrollantas.',
      'Samuel V. (Admin) ha generado un nuevo Reporte de Cierre Mensual.',
      'Mundillantas dejó un comentario en "Estrategia de Reels".',
      'Se ha detectado conexión activa del equipo técnico iGenius.',
      'CERFIK aprobó el entregable de Pauta del mes.',
      'Un nuevo colaborador externo se conectó para auditar la campaña.',
    ];
    
    const interval = setInterval(() => {
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setLiveEvents((prev) => [
        `🟢 [${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${randomEvent}`,
        ...prev.slice(0, 4)
      ]);
    }, 45000);

    return () => clearInterval(interval);
  }, [companies]);

  // Generar URL de compartición con roles y parámetros
  const generateSharingLink = (role: 'Admin' | 'Equipo' | 'Cliente', companyId?: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    let name = 'Sofía Pasquel';
    if (role === 'Equipo') name = 'Carlos Gómez';
    if (role === 'Admin') name = 'Samuel V.';
    
    let url = `${baseUrl}?role=${role.toLowerCase()}&name=${encodeURIComponent(name)}`;
    if (role === 'Cliente' && companyId && companyId !== 'all') {
      url += `&company=${companyId}`;
    }
    return url;
  };

  const handleCopyLink = (role: 'Admin' | 'Equipo' | 'Cliente') => {
    const link = generateSharingLink(role, selectedCompanyId);
    navigator.clipboard.writeText(link);
    setCopiedLink(role + '_copied');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // --- PERSISTENCIA ---
  useEffect(() => {
    localStorage.setItem('cronograma_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('cronograma_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('wt_app_color', appColor);
  }, [appColor]);

  useEffect(() => {
    localStorage.setItem('wt_default_priority', defaultPriority);
  }, [defaultPriority]);

  useEffect(() => {
    localStorage.setItem('wt_enable_alerts', String(enableAlerts));
  }, [enableAlerts]);

  const handleResetData = () => {
    localStorage.removeItem('cronograma_companies');
    localStorage.removeItem('cronograma_tasks');
    localStorage.removeItem('wt_app_color');
    localStorage.removeItem('wt_default_priority');
    localStorage.removeItem('wt_enable_alerts');
    setCompanies(INITIAL_COMPANIES);
    const seeded = INITIAL_TASKS.map((t, index) => {
      const withComments: Task = { ...t };
      if (!withComments.comments) {
        withComments.comments = [];
      }
      if (index === 0) {
        withComments.comments = [
          { id: 'c-init-1', authorName: 'Sofía Pasquel', authorRole: 'Cliente', text: 'Excelente propuesta de parrilla. Me encanta el enfoque Growth Scaling para este mes de campaña.', timestamp: '10:30 AM - Hace 2 días' },
          { id: 'c-init-2', authorName: 'Samuel V.', authorRole: 'Admin', text: '¡Excelente Sofía! El equipo técnico de iGenius ya está estructurando los mockups y copys.', timestamp: '11:15 AM - Hace 2 días' }
        ];
      } else if (index === 1) {
        withComments.comments = [
          { id: 'c-init-3', authorName: 'Sofía Pasquel', authorRole: 'Cliente', text: '¿Podríamos agregar exclusión para competidores locales en la campaña de pauta?', timestamp: '09:15 AM - Hoy' },
          { id: 'c-init-4', authorName: 'Carlos Gómez', authorRole: 'Equipo', text: 'Entendido Sofía. Añadida la lista de exclusiones de palabras clave negativas.', timestamp: '10:00 AM - Hoy' }
        ];
      } else if (index === 2) {
        withComments.comments = [
          { id: 'c-init-5', authorName: 'Samuel V.', authorRole: 'Admin', text: 'Carlos, por favor verifica el retraso del disparador de bienvenida en ActiveCampaign antes de lanzar el automation.', timestamp: 'Ayer' }
        ];
      }
      return withComments;
    });
    setTasks(seeded);
    setAppColor('#3b82f6');
    setDefaultPriority('Media');
    setEnableAlerts(true);
  };

  // --- CRUD OPERACIONES ---

  // Agregar Empresa
  const handleAddCompany = (newComp: Omit<Company, 'id'>) => {
    const company: Company = {
      ...newComp,
      id: `company-${Date.now()}`,
    };
    setCompanies([...companies, company]);
  };

  // Actualizar Empresa
  const handleUpdateCompany = (updated: Company) => {
    setCompanies(companies.map((c) => (c.id === updated.id ? updated : c)));
  };

  // Eliminar Empresa
  const handleDeleteCompany = (id: string) => {
    setCompanies(companies.filter((c) => c.id !== id));
    // Opcionalmente desvincular tareas asignadas a esa empresa
    setTasks(tasks.filter((t) => t.companyId !== id));
  };

  // Guardar Tarea (Crear o Editar)
  const handleSaveTask = (savedTask: Task) => {
    const exists = tasks.some((t) => t.id === savedTask.id);
    if (exists) {
      setTasks(tasks.map((t) => (t.id === savedTask.id ? savedTask : t)));
    } else {
      setTasks([...tasks, savedTask]);
    }
  };

  // Eliminar Tarea
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Duplicar Tarea (Útil para tareas recurrentes)
  const handleDuplicateTask = (taskToCopy: Task) => {
    // Generar duplicado con ID nuevo, fechas limpias y progreso inicial en 0
    const duplicated: Task = {
      ...taskToCopy,
      id: `task-dup-${Date.now()}`,
      title: `${taskToCopy.title} (Copia)`,
      status: 'Por hacer',
      progress: 0,
      checklist: taskToCopy.checklist?.map((sub) => ({
        ...sub,
        id: `sub-dup-${Date.now()}-${Math.random()}`,
        completed: false, // Reiniciar checklist
      })) || [],
    };
    setSelectedTask(duplicated);
    setIsTaskModalOpen(true);
  };

  // Cambiar estado desde el Kanban (drag and drop)
  const handleUpdateTaskStatus = (id: string, newStatus: TaskStatus) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          // Si se marca como completado y tiene checklist, completar todo o viceversa
          let progress = t.progress;
          let checklist = t.checklist ? [...t.checklist] : [];
          
          if (newStatus === 'Completado') {
            progress = 100;
            checklist = checklist.map((sub) => ({ ...sub, completed: true }));
          } else if (newStatus === 'Por hacer') {
            progress = 0;
            checklist = checklist.map((sub) => ({ ...sub, completed: false }));
          }

          return {
            ...t,
            status: newStatus,
            progress,
            checklist,
          };
        }
        return t;
      })
    );
  };

  // Limpiar filtros rápidos
  const handleResetFilters = () => {
    setSelectedCompanyId('all');
    setSearchQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
  };

  // --- CÁLCULO DE MÉTRICAS GLOBALES ---
  // Filtrar según el selector global superior de cliente
  const clientFilteredTasks = tasks.filter(
    (t) => selectedCompanyId === 'all' || t.companyId === selectedCompanyId
  );

  const totalTasks = clientFilteredTasks.length;
  const completedTasks = clientFilteredTasks.filter((t) => t.status === 'Completado').length;
  const inProgressTasks = clientFilteredTasks.filter((t) => t.status === 'En proceso' || t.status === 'En revisión').length;
  const pendingTasks = clientFilteredTasks.filter((t) => t.status !== 'Completado' && t.status !== 'Bloqueado').length;
  const blockedTasks = clientFilteredTasks.filter((t) => t.status === 'Bloqueado').length;
  const progressRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Estado para pre-establecer la fecha de una tarea
  const [taskDefaultDate, setTaskDefaultDate] = useState<string | undefined>(undefined);

  // Abrir modal de tareas para edición
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setTaskDefaultDate(undefined);
    setIsTaskModalOpen(true);
  };

  // Abrir modal de tareas para creación
  const handleNewTask = (dateStr?: string) => {
    setSelectedTask(null);
    setTaskDefaultDate(dateStr);
    setIsTaskModalOpen(true);
  };

  const hasActiveFilters =
    selectedCompanyId !== 'all' ||
    searchQuery !== '' ||
    selectedType !== 'all' ||
    selectedStatus !== 'all' ||
    selectedPriority !== 'all';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row selection:bg-blue-100 selection:text-blue-800 overflow-hidden h-screen">
      
      {/* --- SIDEBAR LATERAL (WeekTrack Left Panel) --- */}
      <aside className={`bg-slate-900 text-slate-100 flex-shrink-0 border-r border-slate-800 flex flex-col transition-all duration-300 z-50 ${
        isSidebarOpen ? 'w-72' : 'w-0 md:w-20'
      } overflow-hidden h-full relative`}>
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-white leading-none">WeekTrack</h1>
                <span className="text-[9px] text-blue-400 font-bold tracking-wider uppercase">Sistema de Seguimiento</span>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700/80 px-1.5 py-0.5 rounded-full font-bold">
              v1.2 Live
            </span>
          )}
        </div>

        {/* Sidebar Navigation Items */}
        <div className="p-4 space-y-1.5 flex-shrink-0">
          <span className="px-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {isSidebarOpen ? 'Navegación' : 'Nav'}
          </span>
          
          {/* Planificación / Inicio */}
          <button
            id="tab-planificacion"
            onClick={() => {
              if (activeTab === 'colaboracion') {
                setActiveTab('calendario');
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
              activeTab !== 'colaboracion'
                ? 'text-white shadow-lg shadow-blue-600/10'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
            style={activeTab !== 'colaboracion' ? { backgroundColor: appColor } : {}}
          >
            <Calendar className="w-4 h-4 flex-shrink-0" />
            {isSidebarOpen && <span>Planificación</span>}
          </button>

          {/* Colaboración & Chat */}
          <button
            id="tab-colaboracion"
            onClick={() => setActiveTab('colaboracion')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
              activeTab === 'colaboracion'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            {isSidebarOpen && (
              <div className="flex items-center justify-between flex-1">
                <span>Colaboración & Chat</span>
              </div>
            )}
          </button>
        </div>

        {/* Sidebar Action Buttons (Clientes & Reporte de Mes) */}
        <div className="px-4 py-2 flex-shrink-0 space-y-2 border-t border-slate-800/80 pt-4">
          <span className="px-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {isSidebarOpen ? 'Administración' : 'Admin'}
          </span>
          
          {/* Gestión de Empresas (Clientes) */}
          {activeUserRole === 'Admin' && (
            <button
              id="sidebar-company-btn"
              onClick={() => setIsCompanyModalOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer text-left"
            >
              <Users className="w-4 h-4 flex-shrink-0 text-slate-400" />
              {isSidebarOpen && <span>Administrar Clientes</span>}
            </button>
          )}

          {/* Botón Reporte */}
          <button
            id="sidebar-report-btn"
            onClick={() => setIsReportModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer text-left"
          >
            <FileText className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            {isSidebarOpen && <span>Reporte de Mes</span>}
          </button>

          {/* Botón Configuración de App */}
          <button
            id="sidebar-config-btn"
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer text-left"
          >
            <Settings className="w-4 h-4 flex-shrink-0 text-indigo-400" />
            {isSidebarOpen && <span>Configuración de App</span>}
          </button>
        </div>

        {/* Test Collaborative Roles Controller */}
        <div className="px-4 py-4 flex-1 overflow-y-auto space-y-4 border-t border-slate-800/60">
          {isSidebarOpen && (
            <div className="bg-slate-850 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Simulador de Roles</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Cambia el rol actual para auditar vistas, checklists y escribir comentarios como Líder, Equipo o Cliente:
              </p>
              
              <div className="grid grid-cols-3 gap-1 pt-1">
                <button
                  onClick={() => {
                    setActiveUserRole('Admin');
                    setActiveUserName('Samuel V. (iGenius)');
                  }}
                  className={`py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                    activeUserRole === 'Admin'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:bg-slate-750'
                  }`}
                  title="Samuel V. (Admin)"
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    setActiveUserRole('Equipo');
                    setActiveUserName('Carlos Gómez (Diseño)');
                  }}
                  className={`py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                    activeUserRole === 'Equipo'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:bg-slate-750'
                  }`}
                  title="Carlos Gómez (Diseño)"
                >
                  Equipo
                </button>
                <button
                  onClick={() => {
                    setActiveUserRole('Cliente');
                    setActiveUserName('Sofía Pasquel (Gerente)');
                  }}
                  className={`py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                    activeUserRole === 'Cliente'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:bg-slate-750'
                  }`}
                  title="Sofía Pasquel (Gerente)"
                >
                  Cliente
                </button>
              </div>

              <div className="pt-2 text-[10px] flex items-center justify-between text-slate-400 font-medium">
                <span>Sesión:</span>
                <span className="text-white font-bold">{activeUserName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Collapser controller */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-center flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
            title={isSidebarOpen ? "Colapsar menú" : "Expandir menú"}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-200" />
            )}
          </button>
        </div>
      </aside>

      {/* --- CUERPO PRINCIPAL --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full max-h-screen bg-slate-50">
        
        {/* Header Superior */}
        <header className="bg-white border-b border-slate-150 px-6 py-4 sticky top-0 z-40 shadow-xs flex-shrink-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Logo y Eslogan */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">WeekTrack</h1>
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Sistema de Seguimiento</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Metodología de Crecimiento & Avances en Tiempo Real</p>
              </div>
            </div>

            {/* Selector de Cliente Global & Botones de Acción */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              
              {/* Info actual del rol */}
              <div className="hidden lg:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-slate-700">
                  {activeUserRole === 'Admin' ? 'Líder Sistema' : activeUserRole === 'Equipo' ? 'Equipo Técnico' : 'Gerente Cliente'}
                </span>
                <span className="text-[10px] text-slate-400">• {activeUserName}</span>
              </div>

              {/* Selector de Clientes Global en Cabecera */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 gap-2">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <select
                  id="global-company-filter"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer min-w-[140px]"
                >
                  <option value="all">Todos los Clientes</option>
                  {companies.filter(c => c.status === 'activa').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crear Tarea */}
              {activeUserRole !== 'Cliente' && (
                <button
                  id="open-task-modal-btn"
                  onClick={() => handleNewTask()}
                  className="px-4 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:brightness-95 flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: appColor }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Tarea</span>
                </button>
              )}
            </div>

          </div>
        </header>

        {/* Layout Dashboard */}
        <main className="flex-1 p-4 sm:p-6 space-y-6">
          
          {/* Active Role Quick Banner info for external links */}
          {activeUserRole !== 'Admin' && (
            <div className={`p-3.5 rounded-2xl border ${
              activeUserRole === 'Cliente' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold`}>
              <div className="flex items-center gap-2">
                {activeUserRole === 'Cliente' ? (
                  <span className="p-1 bg-emerald-100 rounded-lg text-emerald-700">💼</span>
                ) : (
                  <span className="p-1 bg-indigo-100 rounded-lg text-indigo-700">👥</span>
                )}
                <div>
                  <p>Has accedido a través del link de compartición en tiempo real como <strong className="underline">{activeUserName}</strong>.</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {activeUserRole === 'Cliente' 
                      ? 'Como Gerente de la empresa cliente puedes auditar avances, marcar entregables completados y dejar comentarios de feedback.' 
                      : 'Como miembro del equipo de iGenius Solutions puedes editar, completar y colaborar.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveUserRole('Admin');
                  setActiveUserName('Samuel V. (iGenius)');
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-[10px] font-bold"
              >
                Volver a Modo Admin
              </button>
            </div>
          )}

          {/* --- VIEW ROUTER --- */}
          {activeTab === 'colaboracion' ? (
            
            /* --- VISTA DE COLABORACIÓN Y FEED DE COMENTARIOS --- */
            <div className="space-y-6">
              
              {/* Header de Colaboracion */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="space-y-2 z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Módulo Colaborativo
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight">Centro de Compartición y Comentarios</h2>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Administra y comparte enlaces dinámicos con clientes y el equipo técnico. Los gerentes clientes pueden interactuar con comentarios, feedback directo y seguimiento de entregables.
                  </p>
                </div>

                <div className="z-10 flex flex-wrap gap-2 flex-shrink-0">
                  <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700 text-center min-w-[100px]">
                    <span className="text-xs font-bold text-slate-400 block mb-0.5">Mensajes</span>
                    <span className="text-2xl font-extrabold text-white">
                      {tasks.reduce((sum, t) => sum + (t.comments?.length || 0), 0)}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700 text-center min-w-[100px]">
                    <span className="text-xs font-bold text-slate-400 block mb-0.5">Roles Activos</span>
                    <span className="text-2xl font-extrabold text-emerald-400">3 Activos</span>
                  </div>
                </div>
              </div>

              {/* Fila de Tarjetas para Compartir Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Admin Link */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 relative flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">Enlace de Administrador</h3>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                        Control absoluto para planificación, creación de hitos, borrado y configuración completa de clientes.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyLink('Admin')}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink === 'Admin_copied' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" /> ¡Copiado en Admin!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" /> Copiar Link Admin
                      </>
                    )}
                  </button>
                </div>

                {/* Team Editor Link */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 relative flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">Enlace del Equipo Técnico</h3>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                        Habilita la edición de entregables, checklist de avance y comentarios directos para diseñadores, redactores y media buyers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyLink('Equipo')}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink === 'Equipo_copied' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" /> ¡Copiado de Equipo!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" /> Copiar Link Equipo
                      </>
                    )}
                  </button>
                </div>

                {/* Client Link */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 relative flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">Enlace de Gerente de Cliente</h3>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                        Ideal para el cliente. Bloquea campos críticos de planificación para que actúe como auditor directo y de feedback.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyLink('Cliente')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink === 'Cliente_copied' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" /> ¡Copiado de Cliente!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" /> Copiar Link de Cliente
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Feed Centralizado de Comentarios en Tiempo Real */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Listado Principal de Comentarios Cruzados */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Muro Comunitario de Feedback</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Todos los comentarios cruzados de tus entregables en un solo canal.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">Historial</span>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {(() => {
                      const allComments: Array<{ task: Task; comment: any }> = [];
                      tasks.forEach(t => {
                        if (t.comments) {
                          t.comments.forEach(c => {
                            allComments.push({ task: t, comment: c });
                          });
                        }
                      });

                      if (allComments.length === 0) {
                        return (
                          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400 font-bold">No hay comentarios en la plataforma</p>
                            <p className="text-xs text-slate-400 mt-1">Los comentarios que realicen los clientes aparecerán listados aquí.</p>
                          </div>
                        );
                      }

                      // Ordenar por simulación de tiempo si es posible, o dejarlos listados
                      return allComments.map(({ task, comment }) => {
                        const comp = companies.find(c => c.id === task.companyId);
                        const roleMeta = {
                          Admin: { label: 'Líder iGenius', color: 'bg-blue-50 text-blue-700 border-blue-200/50' },
                          Equipo: { label: 'Equipo Técnico', color: 'bg-indigo-50 text-indigo-700 border-indigo-200/50' },
                          Cliente: { label: 'Gerente Cliente', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50' },
                        };
                        const meta = roleMeta[comment.authorRole as 'Admin'|'Equipo'|'Cliente'] || { label: 'Colaborador', color: 'bg-slate-50 text-slate-600 border-slate-200' };

                        return (
                          <div 
                            key={comment.id} 
                            className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-xs text-slate-700">{comment.authorName}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${meta.color}`}>
                                    {meta.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400">• {comment.timestamp}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-wrap">
                                  {comment.text}
                                </p>
                              </div>

                              <button
                                onClick={() => handleSelectTask(task)}
                                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-[10px] font-bold flex items-center gap-1 flex-shrink-0 cursor-pointer"
                              >
                                <span>Ver Tarea</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Detalle de Tarea Referenciada */}
                            <div className="pt-2.5 border-t border-slate-150 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: comp?.color }} />
                                <span>{comp?.name || 'Cliente'}</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-600 max-w-[150px] sm:max-w-xs truncate">{task.title}</span>
                              </div>
                              <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase tracking-wider">{task.status}</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Guía de Metodología de Feedback */}
                <div className="space-y-6">
                  
                  {/* Status / Log Widget */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      Auditoría de Colaboración
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Esta app implementa el control de accesos directos por rol, evitando que los clientes accidenten la planificación de iGenius Solutions, pero permitiendo un ágil feedback diario.
                    </p>
                    
                    <div className="space-y-3 pt-2 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold">
                        <span className="text-slate-500">¿Clientes pueden borrar?</span>
                        <span className="text-red-600 font-extrabold">No, denegado</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold">
                        <span className="text-slate-500">¿Clientes pueden re-planificar?</span>
                        <span className="text-red-600 font-extrabold">No, denegado</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 font-semibold">
                        <span className="text-slate-500">¿Clientes pueden comentar?</span>
                        <span className="text-emerald-600 font-extrabold">Sí, habilitado</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 font-semibold">
                        <span className="text-slate-500">¿Clientes pueden completar checklists?</span>
                        <span className="text-emerald-600 font-extrabold">Sí, habilitado</span>
                      </div>
                    </div>
                  </div>

                  {/* Banner descriptivo */}
                  <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-5 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-extrabold text-sm">Metodología Growth Scaling</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      Establecer hitos claros y transparentes acelera la confianza gerencial. Usa el canal de compartición de WeekTrack para sincronizar a todos los niveles de decisión.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          ) : (
            
            /* --- DASHBOARD CENTRAL (Vistas Calendario, Kanban, Roadmap, Timeline) --- */
            <div className="space-y-6">
              
              {/* --- MENÚ DE VISTAS (TABS INTERNAS) --- */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200 overflow-x-auto scrollbar-none flex-1 md:flex-initial">
                  <button
                    id="inner-tab-calendario"
                    onClick={() => setActiveTab('calendario')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex-1 md:flex-initial whitespace-nowrap ${
                      activeTab === 'calendario'
                        ? 'bg-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                    style={activeTab === 'calendario' ? { color: appColor } : {}}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Calendario</span>
                  </button>

                  <button
                    id="inner-tab-kanban"
                    onClick={() => setActiveTab('kanban')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex-1 md:flex-initial whitespace-nowrap ${
                      activeTab === 'kanban'
                        ? 'bg-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                    style={activeTab === 'kanban' ? { color: appColor } : {}}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Tablero Kanban</span>
                  </button>

                  <button
                    id="inner-tab-roadmap"
                    onClick={() => setActiveTab('roadmap')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex-1 md:flex-initial whitespace-nowrap ${
                      activeTab === 'roadmap'
                        ? 'bg-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                    style={activeTab === 'roadmap' ? { color: appColor } : {}}
                  >
                    <Map className="w-4 h-4" />
                    <span>Roadmap</span>
                  </button>

                  <button
                    id="inner-tab-timeline"
                    onClick={() => setActiveTab('timeline')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex-1 md:flex-initial whitespace-nowrap ${
                      activeTab === 'timeline'
                        ? 'bg-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                    style={activeTab === 'timeline' ? { color: appColor } : {}}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Gantt / Timeline</span>
                  </button>
                </div>
                <div className="hidden sm:block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider px-2">
                  Vista activa: <span className="font-black" style={{ color: appColor }}>{activeTab === 'timeline' ? 'Gantt / Timeline' : activeTab.toUpperCase()}</span>
                </div>
              </div>

              {/* --- MÉTRICAS DE RESUMEN --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 flex-shrink-0">
                
                {/* Card 1: Planificadas */}
                <motion.div 
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Planificadas</span>
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalTasks}</span>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Hitos totales del mes</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Activas</span>
                  </div>
                </motion.div>

                {/* Card 2: Completadas */}
                <motion.div 
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Completadas</span>
                      <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">{completedTasks}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Entregables validados</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% Listas
                    </span>
                  </div>
                </motion.div>

                {/* Card 3: En Progreso */}
                <motion.div 
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500 rounded-l-2xl"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">En Progreso</span>
                      <span className="text-3xl font-extrabold text-orange-600 tracking-tight">{inProgressTasks}</span>
                    </div>
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Ejecución o revisión</span>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">En Marcha</span>
                  </div>
                </motion.div>

                {/* Card 4: Cumplimiento */}
                <motion.div 
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group text-white"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-indigo-600 rounded-l-2xl"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block mb-0.5">Cumplimiento</span>
                      <span className="text-3xl font-extrabold text-white tracking-tight">{progressRate}%</span>
                    </div>
                    <div className="p-3 bg-white/10 text-blue-400 rounded-xl group-hover:bg-white/15 group-hover:text-blue-300 transition-all">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  
                  {/* Growth Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Rendimiento Mensual</span>
                      <span className="text-blue-400">Growth Index</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* --- BARRA DE FILTROS Y BÚSQUEDA --- */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                  
                  {/* Buscador de texto libre */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="search-task-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar entregables, tareas, estrategias..."
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>

                  {/* Selectores de filtros cruzados */}
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Filtro por Tipo */}
                    <select
                      id="filter-type-select"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-600 bg-white"
                    >
                      <option value="all">Cualquier Entregable</option>
                      <option value="Contenido">Contenido</option>
                      <option value="Pauta">Pauta</option>
                      <option value="CRM">CRM</option>
                      <option value="Reunión">Reunión</option>
                      <option value="Entrega">Entrega</option>
                      <option value="Administrativo">Administrativo</option>
                      <option value="Otro">Otro</option>
                    </select>

                    {/* Filtro por Estado */}
                    <select
                      id="filter-status-select"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-600 bg-white"
                    >
                      <option value="all">Cualquier Estado</option>
                      <option value="Por hacer">Por hacer</option>
                      <option value="En proceso">En proceso</option>
                      <option value="En revisión">En revisión</option>
                      <option value="Completado">Completado</option>
                      <option value="Bloqueado">Bloqueado</option>
                    </select>

                    {/* Filtro por Prioridad */}
                    <select
                      id="filter-priority-select"
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-600 bg-white"
                    >
                      <option value="all">Cualquier Prioridad</option>
                      <option value="Alta">Prioridad Alta</option>
                      <option value="Media">Prioridad Media</option>
                      <option value="Baja">Prioridad Baja</option>
                    </select>

                    {/* Limpiar Filtros */}
                    {hasActiveFilters && (
                      <button
                        id="reset-filters-btn"
                        onClick={handleResetFilters}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                        title="Restablecer Filtros"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                  </div>
                </div>
              </div>

              {/* Header De Vista Activa en Cuerpo */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    Panel: {activeTab === 'timeline' ? 'Gantt / Timeline' : activeTab.toUpperCase()}
                  </h3>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Filtro activo: {selectedCompanyId === 'all' ? 'Todas las Empresas' : companies.find(c => c.id === selectedCompanyId)?.name}
                </div>
              </div>

              {/* --- CONTAINER DE LAS VISTAS --- */}
              <div className="transition-all duration-300">
                {totalTasks === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">No se encontraron tareas</h3>
                      <p className="text-sm text-slate-400 mt-1 max-w-md">
                        No hay entregables planificados para los filtros actuales. Crea una nueva tarea para comenzar a rellenar el cronograma mensual.
                      </p>
                    </div>
                    {activeUserRole !== 'Cliente' && (
                      <button
                        id="create-first-task-btn"
                        onClick={() => handleNewTask()}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Registrar Primer Entregable
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {activeTab === 'calendario' && (
                      <CalendarView
                        tasks={tasks}
                        companies={companies}
                        onSelectTask={handleSelectTask}
                        onNewTaskWithDate={handleNewTask}
                        selectedCompanyId={selectedCompanyId}
                        searchQuery={searchQuery}
                        selectedType={selectedType}
                        selectedStatus={selectedStatus}
                        selectedPriority={selectedPriority}
                      />
                    )}

                    {activeTab === 'kanban' && (
                      <KanbanView
                        tasks={tasks}
                        companies={companies}
                        onSelectTask={handleSelectTask}
                        onUpdateTaskStatus={handleUpdateTaskStatus}
                        selectedCompanyId={selectedCompanyId}
                        searchQuery={searchQuery}
                        selectedType={selectedType}
                        selectedStatus={selectedStatus}
                        selectedPriority={selectedPriority}
                      />
                    )}

                    {activeTab === 'roadmap' && (
                      <RoadmapView
                        tasks={tasks}
                        companies={companies}
                        onSelectTask={handleSelectTask}
                        selectedCompanyId={selectedCompanyId}
                        searchQuery={searchQuery}
                        selectedType={selectedType}
                        selectedStatus={selectedStatus}
                        selectedPriority={selectedPriority}
                      />
                    )}

                    {activeTab === 'timeline' && (
                      <TimelineView
                        tasks={tasks}
                        companies={companies}
                        onSelectTask={handleSelectTask}
                        selectedCompanyId={selectedCompanyId}
                        searchQuery={searchQuery}
                        selectedType={selectedType}
                        selectedStatus={selectedStatus}
                        selectedPriority={selectedPriority}
                      />
                    )}
                  </>
                )}
              </div>

            </div>
          )}

        </main>

        {/* --- FOOTER INFORMATIVO --- */}
        <footer className="bg-white border-t border-slate-150 py-4 px-6 text-center text-xs text-slate-400 font-semibold mt-auto flex-shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 Sistema de Seguimiento. Todos los derechos reservados.</span>
            <div className="flex gap-4">
              <span className="text-slate-500 font-bold">Metodología Growth Scaling</span>
              <span>•</span>
              <span>Versión 1.2.0 (Offline-First Realtime)</span>
            </div>
          </div>
        </footer>

      </div>

      {/* --- MODALES --- */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        companies={companies}
        onAddCompany={handleAddCompany}
        onUpdateCompany={handleUpdateCompany}
        onDeleteCompany={handleDeleteCompany}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={selectedTask}
        companies={companies}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        onDuplicateTask={handleDuplicateTask}
        defaultDate={taskDefaultDate}
        activeUserRole={activeUserRole}
        activeUserName={activeUserName}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        tasks={tasks}
        companies={companies}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onResetData={handleResetData}
        appColor={appColor}
        setAppColor={setAppColor}
        defaultPriority={defaultPriority}
        setDefaultPriority={setDefaultPriority}
        enableAlerts={enableAlerts}
        setEnableAlerts={setEnableAlerts}
      />

    </div>
  );
}
