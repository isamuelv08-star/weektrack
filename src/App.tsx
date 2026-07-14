import { useState, useEffect } from 'react';
import { Company, Task, TaskStatus, TaskPriority, TaskType, AccessRequest } from './types';
import { INITIAL_COMPANIES, INITIAL_TASKS } from './initialData';

// Modales
import CompanyModal from './components/CompanyModal';
import TaskModal from './components/TaskModal';
import ReportModal from './components/ReportModal';
import SettingsModal from './components/SettingsModal';

// Componentes de Seguridad y Acceso
import Login from './components/Login';
import AccessDenied from './components/AccessDenied';

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
  LogOut,
  Radio,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from './supabase';

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
  const [restrictedCompanyId, setRestrictedCompanyId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const companyParam = params.get('company');
    const sessionRole = sessionStorage.getItem('wt_current_user_role') || roleParam;
    
    if (sessionRole === 'admin' || sessionRole === 'Admin') {
      return null;
    }
    if (companyParam) {
      sessionStorage.setItem('wt_restricted_company_id', companyParam);
      return companyParam;
    }
    return sessionStorage.getItem('wt_restricted_company_id') || null;
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const companyParam = params.get('company');
    const sessionRole = sessionStorage.getItem('wt_current_user_role') || roleParam;
    
    if (sessionRole === 'admin' || sessionRole === 'Admin') {
      return 'all';
    }
    if (companyParam) {
      return companyParam;
    }
    return sessionStorage.getItem('wt_restricted_company_id') || 'all';
  });

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

  // --- ESTADOS DE COLABORACIÓN, SEGURIDAD Y CONTROL DE ROLES ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wt_authenticated') === 'true';
  });

  const [activeUserRole, setActiveUserRole] = useState<'Admin' | 'Equipo' | 'Cliente'>(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'cliente' || roleParam === 'Cliente') return 'Cliente';
    if (roleParam === 'equipo' || roleParam === 'Equipo') return 'Equipo';
    
    // Buscar en sesión
    const sessionRole = sessionStorage.getItem('wt_current_user_role');
    if (sessionRole === 'Cliente' || sessionRole === 'Equipo' || sessionRole === 'Admin') {
      return sessionRole as 'Admin' | 'Equipo' | 'Cliente';
    }
    return 'Admin';
  });

  const [activeUserName, setActiveUserName] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get('name');
    if (nameParam) return nameParam;

    const sessionName = sessionStorage.getItem('wt_current_user_name');
    if (sessionName) return sessionName;

    if (activeUserRole === 'Cliente') return 'Sofía Pasquel (Gerente)';
    if (activeUserRole === 'Equipo') return 'Carlos Gómez (Diseño)';
    return 'Samuel V. (iGenius)';
  });

  const [activeUserEmail, setActiveUserEmail] = useState<string>(() => {
    const sessionEmail = sessionStorage.getItem('wt_current_user_email');
    if (sessionEmail) return sessionEmail;

    if (activeUserRole === 'Cliente') return 'sofia@mundillantas.com';
    if (activeUserRole === 'Equipo') return 'carlos@igenius.com';
    return 'samuel@igenius.com';
  });

  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() => {
    const local = localStorage.getItem('wt_access_requests');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return [
      { id: 'req-1', name: 'Carlos Gómez (Diseño)', role: 'Equipo', status: 'pending', timestamp: 'Hace 2 horas' },
      { id: 'req-2', name: 'Sofía Pasquel (Gerente)', role: 'Cliente', status: 'pending', timestamp: 'Hace 5 minutos' }
    ];
  });

  const [copiedLink, setCopiedLink] = useState<string | boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [liveEvents, setLiveEvents] = useState<string[]>([
    '🟢 [10:14 AM] Samuel V. (Líder Admin) ha ingresado al tablero.',
    '🟢 [10:15 AM] Carlos Gómez (Diseño) se ha conectado al espacio de trabajo.',
    '👁️ [10:16 AM] Sofía Pasquel (Gerente de Mundillantas) está visualizando el Gantt.',
  ]);

  // Al montar, configurar motor de eventos interactivos de simulación
  useEffect(() => {
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

  // Forzar que el filtro de compañía esté bloqueado al ID restringido si el usuario no es Administrador
  useEffect(() => {
    if (activeUserRole !== 'Admin' && restrictedCompanyId) {
      if (selectedCompanyId !== restrictedCompanyId) {
        setSelectedCompanyId(restrictedCompanyId);
      }
    }
  }, [activeUserRole, restrictedCompanyId, selectedCompanyId]);

  // Generar URL de compartición con roles y parámetros
  const generateSharingLink = (role: 'Admin' | 'Equipo' | 'Cliente', companyId?: string) => {
    const customDomain = localStorage.getItem('wt_custom_share_domain');
    const baseUrl = customDomain ? customDomain.replace(/\/$/, '') : (window.location.origin + window.location.pathname);
    let name = 'Sofía Pasquel';
    if (role === 'Equipo') name = 'Carlos Gómez';
    if (role === 'Admin') name = 'Samuel V.';
    
    let url = `${baseUrl}?role=${role.toLowerCase()}&name=${encodeURIComponent(name)}`;
    if (role !== 'Admin' && companyId && companyId !== 'all') {
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

  const handleCopyLinkForCompany = (role: 'Admin' | 'Equipo' | 'Cliente', companyId: string) => {
    const link = generateSharingLink(role, companyId);
    navigator.clipboard.writeText(link);
    setCopiedLink(`${role}_${companyId}_copied`);
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

  // Guardar solicitudes de acceso de co-editores en localStorage
  useEffect(() => {
    localStorage.setItem('wt_access_requests', JSON.stringify(accessRequests));
  }, [accessRequests]);

  // Escuchar cambios de localStorage en tiempo real para sincronización multipestaña (Event + Polling)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cronograma_tasks' && e.newValue) {
        try {
          setTasks(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === 'cronograma_companies' && e.newValue) {
        try {
          setCompanies(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === 'wt_access_requests' && e.newValue) {
        try {
          setAccessRequests(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Polling de respaldo para entornos sandboxed/iframes donde el evento 'storage' está restringido
    let lastTasksStr = localStorage.getItem('cronograma_tasks') || '[]';
    let lastCompaniesStr = localStorage.getItem('cronograma_companies') || '[]';
    let lastRequestsStr = localStorage.getItem('wt_access_requests') || '[]';

    const interval = setInterval(() => {
      const storedTasksStr = localStorage.getItem('cronograma_tasks');
      const storedCompaniesStr = localStorage.getItem('cronograma_companies');
      const storedRequestsStr = localStorage.getItem('wt_access_requests');

      if (storedTasksStr && storedTasksStr !== lastTasksStr) {
        try {
          setTasks(JSON.parse(storedTasksStr));
          lastTasksStr = storedTasksStr;
        } catch (err) {}
      }
      if (storedCompaniesStr && storedCompaniesStr !== lastCompaniesStr) {
        try {
          setCompanies(JSON.parse(storedCompaniesStr));
          lastCompaniesStr = storedCompaniesStr;
        } catch (err) {}
      }
      if (storedRequestsStr && storedRequestsStr !== lastRequestsStr) {
        try {
          setAccessRequests(JSON.parse(storedRequestsStr));
          lastRequestsStr = storedRequestsStr;
        } catch (err) {}
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Escuchar estado de autenticación de Supabase para mantener la sesión iniciada
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        const user = session.user;
        const meta = user.user_metadata || {};
        const role = (meta.role as 'Admin' | 'Equipo' | 'Cliente') || 'Admin';
        const name = meta.name || user.email?.split('@')[0] || 'Usuario';
        
        setActiveUserRole(role);
        setActiveUserName(name);
        setActiveUserEmail(user.email || '');
        setIsAuthenticated(true);
        sessionStorage.setItem('wt_authenticated', 'true');
        sessionStorage.setItem('wt_current_user_name', name);
        sessionStorage.setItem('wt_current_user_role', role);
        sessionStorage.setItem('wt_current_user_email', user.email || '');
      }
    });

    // Escuchar cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        const meta = user.user_metadata || {};
        const role = (meta.role as 'Admin' | 'Equipo' | 'Cliente') || 'Admin';
        const name = meta.name || user.email?.split('@')[0] || 'Usuario';
        
        setActiveUserRole(role);
        setActiveUserName(name);
        setActiveUserEmail(user.email || '');
        setIsAuthenticated(true);
        sessionStorage.setItem('wt_authenticated', 'true');
        sessionStorage.setItem('wt_current_user_name', name);
        sessionStorage.setItem('wt_current_user_role', role);
        sessionStorage.setItem('wt_current_user_email', user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        sessionStorage.removeItem('wt_authenticated');
        sessionStorage.removeItem('wt_current_user_name');
        sessionStorage.removeItem('wt_current_user_role');
        sessionStorage.removeItem('wt_current_user_email');
        sessionStorage.removeItem('wt_restricted_company_id');
        setRestrictedCompanyId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Verificar si la vista está permitida para el rol actual según la configuración de la empresa
  const isViewAllowed = (viewId: string) => {
    if (activeUserRole === 'Admin') return true;
    if (!restrictedCompanyId) return true;
    const currentCompany = companies.find(c => c.id === restrictedCompanyId);
    if (!currentCompany) return true;
    if (activeUserRole === 'Cliente') {
      return (currentCompany.allowedViewsCliente || ['calendario', 'kanban', 'colaboracion']).includes(viewId);
    }
    if (activeUserRole === 'Equipo') {
      return (currentCompany.allowedViewsEquipo || ['calendario', 'kanban', 'roadmap', 'timeline', 'colaboracion']).includes(viewId);
    }
    return true;
  };

  // Asegurar redirección de pestaña activa si no está permitida para el rol actual
  useEffect(() => {
    if (isAuthenticated && activeUserRole !== 'Admin') {
      if (!isViewAllowed(activeTab)) {
        const views = ['calendario', 'kanban', 'roadmap', 'timeline', 'colaboracion'];
        const fallback = views.find(v => isViewAllowed(v)) as any;
        if (fallback) {
          setActiveTab(fallback);
        }
      }
    }
  }, [activeTab, activeUserRole, restrictedCompanyId, isAuthenticated]);

  // Handlers de Sesión y Control de Accesos
  const handleLogin = (role: 'Admin' | 'Equipo' | 'Cliente', name: string, email: string, companyId?: string) => {
    sessionStorage.setItem('wt_authenticated', 'true');
    sessionStorage.setItem('wt_current_user_name', name);
    sessionStorage.setItem('wt_current_user_role', role);
    sessionStorage.setItem('wt_current_user_email', email);
    
    setActiveUserRole(role);
    setActiveUserName(name);
    setActiveUserEmail(email);
    setIsAuthenticated(true);

    if (companyId) {
      sessionStorage.setItem('wt_restricted_company_id', companyId);
      setRestrictedCompanyId(companyId);
      setSelectedCompanyId(companyId);

      // Redireccionar a la pestaña permitida si la actual está restringida
      const currentCompany = companies.find(c => c.id === companyId);
      if (currentCompany) {
        const allowed = role === 'Cliente'
          ? (currentCompany.allowedViewsCliente || ['calendario', 'kanban', 'colaboracion'])
          : (currentCompany.allowedViewsEquipo || ['calendario', 'kanban', 'roadmap', 'timeline', 'colaboracion']);
        
        if (!allowed.includes(activeTab)) {
          const fallback = allowed[0] as 'calendario' | 'kanban' | 'roadmap' | 'timeline' | 'colaboracion';
          if (fallback) {
            setActiveTab(fallback);
          }
        }
      }
    }

    // Asegurar que exista una solicitud si no es Admin
    if (role !== 'Admin') {
      const exists = accessRequests.some(r => r.role === role);
      if (!exists) {
        const defaultStatus = role === 'Equipo' ? 'approved' : 'pending';
        const newReq: AccessRequest = {
          id: 'req-' + Date.now(),
          name,
          role,
          status: defaultStatus as any,
          timestamp: 'Conectado recientemente'
        };
        setAccessRequests(prev => {
          const updated = [...prev, newReq];
          localStorage.setItem('wt_access_requests', JSON.stringify(updated));
          return updated;
        });
      }
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem('wt_authenticated');
    sessionStorage.removeItem('wt_current_user_name');
    sessionStorage.removeItem('wt_current_user_role');
    sessionStorage.removeItem('wt_current_user_email');
    sessionStorage.removeItem('wt_restricted_company_id');
    setRestrictedCompanyId(null);
    
    // Limpiar params de URL para evitar re-logueos indeseados
    const baseUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, baseUrl);
    
    setIsAuthenticated(false);
  };

  const handleRequestAccess = () => {
    const exists = accessRequests.some(r => r.role === activeUserRole);
    if (exists) {
      setAccessRequests(prev => prev.map(r => {
        if (r.role === activeUserRole) {
          return { ...r, status: 'pending', timestamp: 'Hace unos instantes' };
        }
        return r;
      }));
    } else {
      const newReq: AccessRequest = {
        id: 'req-' + Date.now(),
        name: activeUserName,
        role: activeUserRole,
        status: 'pending',
        timestamp: 'Hace unos instantes'
      };
      setAccessRequests(prev => [...prev, newReq]);
    }
  };

  // Buscar estado de acceso del usuario actual
  const currentRequest = accessRequests.find(
    (r) => r.role === activeUserRole && (r.name.toLowerCase().includes(activeUserName.toLowerCase().split(' ')[0]) || activeUserName.toLowerCase().includes(r.name.toLowerCase().split(' ')[0]))
  ) || null;

  const hasAccess = activeUserRole === 'Admin' || (currentRequest && currentRequest.status === 'approved');

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
    const isApproved = activeUserRole === 'Admin' || (currentRequest && currentRequest.status === 'approved');
    if (!isApproved) {
      alert("Tu solicitud de acceso como co-editor aún no ha sido aprobada por el Administrador. Tienes acceso de solo lectura.");
      return;
    }
    const exists = tasks.some((t) => t.id === savedTask.id);
    if (exists) {
      setTasks(tasks.map((t) => (t.id === savedTask.id ? savedTask : t)));
    } else {
      setTasks([...tasks, savedTask]);
    }
  };

  // Eliminar Tarea
  const handleDeleteTask = (id: string) => {
    const isApproved = activeUserRole === 'Admin' || (currentRequest && currentRequest.status === 'approved');
    if (!isApproved) {
      alert("Tu solicitud de acceso como co-editor aún no ha sido aprobada por el Administrador.");
      return;
    }
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
    const isApproved = activeUserRole === 'Admin' || (currentRequest && currentRequest.status === 'approved');
    if (!isApproved) {
      alert("Tu solicitud de acceso como co-editor aún no ha sido aprobada por el Administrador. Tienes acceso de solo lectura.");
      return;
    }
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

  // Selector de empresas visibles (filtramos de forma estricta para no-administradores)
  const visibleCompanies = activeUserRole === 'Admin' || !restrictedCompanyId
    ? companies
    : companies.filter((c) => c.id === restrictedCompanyId);

  const restrictedCompanyNotFound = isAuthenticated && activeUserRole !== 'Admin' && restrictedCompanyId && !companies.some(c => c.id === restrictedCompanyId);

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

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} companies={companies} />;
  }

  if (restrictedCompanyNotFound) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-red-950 border border-red-900/50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Espacio de Trabajo No Encontrado</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            El enlace de acceso utilizado pertenece a una empresa que ha sido eliminada de la plataforma o es inactiva. Comunícate con el Administrador para solicitar un nuevo enlace de invitación.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-2xl transition-all cursor-pointer border border-slate-700/55"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

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
          {isViewAllowed('colaboracion') && (
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
          )}
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

          {/* Botón Cerrar Sesión */}
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-red-950/40 hover:text-red-300 transition-all cursor-pointer text-left border border-transparent hover:border-red-900/45"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-red-400" />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>

        {/* Spacer layout */}
        <div className="flex-1" />

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
              
              {/* Avatares de Colaboradores Activos en Tiempo Real (Dinámicos) */}
              <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-200/60 rounded-full py-1 pl-2 pr-3.5 mr-1.5 shadow-xs">
                <div className="flex gap-1.5">
                  {/* Samuel V. (Admin) */}
                  <div 
                    className="inline-block h-7 w-7 rounded-full ring-2 ring-blue-100 bg-blue-500 text-white text-[9.5px] font-extrabold flex items-center justify-center relative cursor-help transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                    title="Samuel V. (Admin) - Conectado y Autorizado"
                  >
                    SV
                    <span className="absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full ring-2 ring-white bg-emerald-500 animate-pulse" />
                  </div>

                  {/* Carlos Gómez (Equipo) */}
                  {(() => {
                    const req = accessRequests.find(r => r.role === 'Equipo');
                    const status = req ? req.status : 'pending';
                    if (status !== 'approved') return null;
                    
                    return (
                      <div 
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-indigo-100 bg-indigo-500 text-white text-[9.5px] font-extrabold flex items-center justify-center relative cursor-help transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                        title="Carlos Gómez (Equipo) - Conectado y Autorizado"
                      >
                        CG
                        <span className="absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full ring-2 ring-white bg-emerald-500 animate-pulse" />
                      </div>
                    );
                  })()}

                  {/* Sofía Pasquel (Cliente) */}
                  {(() => {
                    const req = accessRequests.find(r => r.role === 'Cliente');
                    const status = req ? req.status : 'pending';
                    if (status !== 'approved') return null;
                    
                    return (
                      <div 
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-emerald-100 bg-emerald-500 text-white text-[9.5px] font-extrabold flex items-center justify-center relative cursor-help transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                        title="Sofía Pasquel (Cliente) - Conectada y Autorizada"
                      >
                        SP
                        <span className="absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full ring-2 ring-white bg-emerald-500 animate-pulse" />
                      </div>
                    );
                  })()}
                </div>

                {/* Texto de Estado Dinámico */}
                <div className="text-left flex items-center border-l border-slate-200/80 pl-2.5">
                  {(() => {
                    const eqReq = accessRequests.find(r => r.role === 'Equipo');
                    const clReq = accessRequests.find(r => r.role === 'Cliente');
                    const eqStatus = eqReq ? eqReq.status : 'pending';
                    const clStatus = clReq ? clReq.status : 'pending';
                    
                    const approvedCount = 1 + (eqStatus === 'approved' ? 1 : 0) + (clStatus === 'approved' ? 1 : 0);
                    
                    return (
                      <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1.5 tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {approvedCount} {approvedCount === 1 ? 'ACTIVO' : 'ACTIVOS'}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Selector de Clientes Global en Cabecera */}
              {activeUserRole === 'Admin' ? (
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
              ) : (
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">
                    Cliente: {companies.find(c => c.id === selectedCompanyId)?.name || 'Cargando...'}
                  </span>
                </div>
              )}

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

          {/* Alertas de Solicitudes de Acceso Pendientes (Solo para el Admin) */}
          {activeUserRole === 'Admin' && accessRequests.some(r => r.status === 'pending') && (
            <div className="bg-amber-50/95 border border-amber-250 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
                  <Radio className="w-4 h-4 animate-pulse text-amber-600" />
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Solicitud de Acceso Co-Editor</h4>
                  <p className="text-slate-500 mt-0.5">
                    Hay usuarios conectados solicitando permiso de acceso para visualizar y editar este cronograma.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {accessRequests.filter(r => r.status === 'pending').map((req) => (
                  <div key={req.id} className="bg-white border border-amber-200 rounded-xl py-1.5 px-3 flex items-center gap-3 shadow-2xs">
                    <span className="font-bold text-slate-800 text-[11px]">
                      {req.name} <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-extrabold uppercase">{req.role}</span>
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setAccessRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] cursor-pointer"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => {
                          setAccessRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Active Role Quick Banner info for external links */}
          {activeUserRole !== 'Admin' && (() => {
            const isApproved = activeUserRole === 'Admin' || (currentRequest && currentRequest.status === 'approved');
            return (
              <div className={`p-4 rounded-2xl border ${
                !isApproved 
                  ? 'bg-amber-50/80 text-amber-900 border-amber-200' 
                  : (activeUserRole === 'Cliente' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200')
              } flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-semibold shadow-xs`}>
                <div className="flex items-start md:items-center gap-3">
                  {!isApproved ? (
                    <span className="p-2 bg-amber-100 rounded-xl text-amber-700 animate-pulse">🔒</span>
                  ) : activeUserRole === 'Cliente' ? (
                    <span className="p-2 bg-emerald-100 rounded-xl text-emerald-700">💼</span>
                  ) : (
                    <span className="p-2 bg-indigo-100 rounded-xl text-indigo-700">👥</span>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p>Has accedido como co-editor con el rol <strong className="underline">{activeUserName}</strong>.</p>
                      {!isApproved ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border border-amber-200 tracking-wider flex items-center gap-1">
                          <span className="w-1 h-1 bg-amber-500 rounded-full animate-ping" />
                          Esperando Aprobación
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border border-emerald-200 tracking-wider flex items-center gap-1">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                          Acceso Autorizado y Activo
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      {!isApproved 
                        ? 'Tu acceso de co-editor está en espera de aprobación por el Administrador. Tienes permisos de visualización completos del cronograma.' 
                        : (activeUserRole === 'Cliente' 
                          ? 'Como Gerente Cliente puedes marcar hitos completados y dejar comentarios de feedback en tiempo real.' 
                          : 'Como miembro del Equipo Técnico puedes crear, modificar y estructurar el cronograma completo.')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                  <button 
                    onClick={() => {
                      setActiveUserRole('Admin');
                      setActiveUserName('Samuel V. (iGenius)');
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-all text-[10px] font-extrabold shadow-2xs cursor-pointer flex-shrink-0"
                  >
                    Volver a Modo Admin
                  </button>
                </div>
              </div>
            );
          })()}

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
                  <div className="flex flex-col gap-2">
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
                    <button
                      onClick={() => {
                        setActiveUserRole('Admin');
                        setActiveUserName('Samuel V. (iGenius)');
                      }}
                      className={`w-full py-1.5 border rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        activeUserRole === 'Admin'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {activeUserRole === 'Admin' ? 'Modo Admin Activo' : 'Simular Modo Admin'}
                    </button>
                  </div>
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

                      {(() => {
                        const req = accessRequests.find(r => r.role === 'Equipo');
                        if (!req) return null;
                        return (
                          <div className="p-2 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-[11px] font-semibold mt-2.5">
                            <span className="text-slate-500 text-[10px]">Acceso:</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase rounded-full border ${
                                req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-red-50 text-red-700 border-red-100'
                              }`}>
                                {req.status === 'approved' ? 'Aprobado' : req.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                              </span>
                              {activeUserRole === 'Admin' && (
                                <button
                                  onClick={() => {
                                    setAccessRequests(prev => prev.map(r => r.role === 'Equipo' ? { ...r, status: r.status === 'approved' ? 'rejected' : 'approved' } : r));
                                  }}
                                  className="text-[9px] text-blue-600 hover:underline cursor-pointer font-black"
                                >
                                  {req.status === 'approved' ? 'Revocar' : 'Aprobar'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Botones de copiado de link por empresa */}
                    <div>
                      {selectedCompanyId !== 'all' ? (
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                          <span className="text-[10px] text-slate-400 font-bold block mb-1">Empresa seleccionada:</span>
                          <span className="text-xs font-extrabold text-slate-700 block mb-2">{companies.find(c => c.id === selectedCompanyId)?.name}</span>
                          <button
                            onClick={() => handleCopyLinkForCompany('Equipo', selectedCompanyId)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {copiedLink === `Equipo_${selectedCompanyId}_copied` ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" /> ¡Enlace Copiado!
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5" /> Copiar Enlace Equipo
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="border border-slate-150 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 border-b border-slate-150 py-1.5 px-2 text-center">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Copiar Enlace por Empresa</span>
                          </div>
                          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 p-1 bg-white">
                            {companies.filter(c => c.status === 'activa').map((comp) => (
                              <div key={comp.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: comp.color }} />
                                  <span className="text-[11px] font-bold text-slate-700 truncate">{comp.name}</span>
                                </div>
                                <button
                                  onClick={() => handleCopyLinkForCompany('Equipo', comp.id)}
                                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md text-[9px] transition-colors cursor-pointer shrink-0"
                                >
                                  {copiedLink === `Equipo_${comp.id}_copied` ? '¡Copiado!' : 'Copiar'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const targetCompId = selectedCompanyId !== 'all' ? selectedCompanyId : companies.filter(c => c.status === 'activa')[0]?.id;
                        setActiveUserRole('Equipo');
                        setActiveUserName('Carlos Gómez (Diseño)');
                        if (targetCompId) {
                          setSelectedCompanyId(targetCompId);
                          setRestrictedCompanyId(targetCompId);
                          sessionStorage.setItem('wt_restricted_company_id', targetCompId);
                        }
                      }}
                      className={`w-full py-1.5 border rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        activeUserRole === 'Equipo'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {activeUserRole === 'Equipo' ? 'Modo Equipo Activo' : 'Simular Modo Equipo'}
                    </button>
                  </div>
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

                      {(() => {
                        const req = accessRequests.find(r => r.role === 'Cliente');
                        if (!req) return null;
                        return (
                          <div className="p-2 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-[11px] font-semibold mt-2.5">
                            <span className="text-slate-500 text-[10px]">Acceso:</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase rounded-full border ${
                                req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-red-50 text-red-700 border-red-100'
                              }`}>
                                {req.status === 'approved' ? 'Aprobado' : req.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                              </span>
                              {activeUserRole === 'Admin' && (
                                <button
                                  onClick={() => {
                                    setAccessRequests(prev => prev.map(r => r.role === 'Cliente' ? { ...r, status: r.status === 'approved' ? 'rejected' : 'approved' } : r));
                                  }}
                                  className="text-[9px] text-blue-600 hover:underline cursor-pointer font-black"
                                >
                                  {req.status === 'approved' ? 'Revocar' : 'Aprobar'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Botones de copiado de link por empresa */}
                    <div>
                      {selectedCompanyId !== 'all' ? (
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                          <span className="text-[10px] text-slate-400 font-bold block mb-1">Empresa seleccionada:</span>
                          <span className="text-xs font-extrabold text-slate-700 block mb-2">{companies.find(c => c.id === selectedCompanyId)?.name}</span>
                          <button
                            onClick={() => handleCopyLinkForCompany('Cliente', selectedCompanyId)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {copiedLink === `Cliente_${selectedCompanyId}_copied` ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" /> ¡Enlace Copiado!
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5" /> Copiar Enlace Cliente
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="border border-slate-150 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 border-b border-slate-150 py-1.5 px-2 text-center">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Copiar Enlace por Empresa</span>
                          </div>
                          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 p-1 bg-white">
                            {companies.filter(c => c.status === 'activa').map((comp) => (
                              <div key={comp.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: comp.color }} />
                                  <span className="text-[11px] font-bold text-slate-700 truncate">{comp.name}</span>
                                </div>
                                <button
                                  onClick={() => handleCopyLinkForCompany('Cliente', comp.id)}
                                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-md text-[9px] transition-colors cursor-pointer shrink-0"
                                >
                                  {copiedLink === `Cliente_${comp.id}_copied` ? '¡Copiado!' : 'Copiar'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const targetCompId = selectedCompanyId !== 'all' ? selectedCompanyId : companies.filter(c => c.status === 'activa')[0]?.id;
                        setActiveUserRole('Cliente');
                        setActiveUserName('Sofía Pasquel (Gerente)');
                        if (targetCompId) {
                          setSelectedCompanyId(targetCompId);
                          setRestrictedCompanyId(targetCompId);
                          sessionStorage.setItem('wt_restricted_company_id', targetCompId);
                        }
                      }}
                      className={`w-full py-1.5 border rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        activeUserRole === 'Cliente'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {activeUserRole === 'Cliente' ? 'Modo Cliente Activo' : 'Simular Modo Cliente'}
                    </button>
                  </div>
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
                  {isViewAllowed('calendario') && (
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
                  )}

                  {isViewAllowed('kanban') && (
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
                  )}

                  {isViewAllowed('roadmap') && (
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
                  )}

                  {isViewAllowed('timeline') && (
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
                  )}
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
                        companies={visibleCompanies}
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
                        companies={visibleCompanies}
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
                        companies={visibleCompanies}
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
                        companies={visibleCompanies}
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
        companies={visibleCompanies}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        onDuplicateTask={handleDuplicateTask}
        defaultDate={taskDefaultDate}
        activeUserRole={activeUserRole}
        activeUserName={activeUserName}
        isApproved={hasAccess}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        tasks={tasks}
        companies={visibleCompanies}
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
        activeUserEmail={activeUserEmail}
        onUpdateEmail={(email) => {
          setActiveUserEmail(email);
          sessionStorage.setItem('wt_current_user_email', email);
        }}
      />

    </div>
  );
}
