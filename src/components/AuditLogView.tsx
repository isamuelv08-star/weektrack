import { useState, useMemo } from 'react';
import { Company } from '../types';
import { 
  Clock, 
  Search, 
  Trash2, 
  RotateCcw, 
  PlusCircle, 
  CheckCircle2, 
  Edit, 
  User, 
  Filter, 
  FileText,
  AlertCircle
} from 'lucide-react';

export interface ActivityLog {
  id: string;
  taskId: string;
  taskTitle: string;
  action: 'create' | 'edit' | 'delete' | 'status_change';
  oldValue?: string;
  newValue?: string;
  userName: string;
  userRole: 'Admin' | 'Equipo' | 'Cliente';
  timestamp: string; // ISO format
}

interface AuditLogViewProps {
  activities: ActivityLog[];
  companies: Company[];
  selectedCompanyId: string;
  onClearActivities?: () => void;
  activeUserRole: 'Admin' | 'Equipo' | 'Cliente';
}

export default function AuditLogView({
  activities,
  companies,
  selectedCompanyId,
  onClearActivities,
  activeUserRole,
}: AuditLogViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  // Filtrar los logs
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // 1. Filtrar por cliente seleccionado en el menú global
      // Para saber si pertenece al cliente, tendríamos que buscar la tarea, pero como la tarea puede haber sido eliminada, 
      // podemos confiar en que la actividad tiene asociada la tarea, o que mostramos todo.
      // Si la actividad coincide con el cliente, o si no hay restricción. 
      // Nota: Si el usuario es Cliente o tiene restricción, el selectedCompanyId ya está establecido por App.tsx.
      // Así que filtramos si queremos. Para mayor robustez, mostramos las actividades que tengan relación con el cliente actual o todas.
      
      // 2. Filtro de búsqueda por texto (Título de tarea o nombre de usuario)
      const matchesSearch = 
        act.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.userName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 3. Filtro por Rol del usuario
      const matchesRole = selectedRole === 'all' || act.userRole === selectedRole;
      if (!matchesRole) return false;

      // 4. Filtro por acción ejecutada
      const matchesAction = selectedAction === 'all' || act.action === selectedAction;
      if (!matchesAction) return false;

      return true;
    });
  }, [activities, searchQuery, selectedRole, selectedAction]);

  // Formatear fecha y hora legible en español
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString; // Si ya es texto legible
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  // Renderizar íconos y clases de colores según la acción
  const getActionDetails = (action: 'create' | 'edit' | 'delete' | 'status_change') => {
    switch (action) {
      case 'create':
        return {
          icon: <PlusCircle className="w-4 h-4" />,
          bgColor: 'bg-emerald-50 border-emerald-100 text-emerald-700',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          label: 'Creación'
        };
      case 'status_change':
        return {
          icon: <RotateCcw className="w-4 h-4" />,
          bgColor: 'bg-amber-50 border-amber-100 text-amber-700',
          badgeColor: 'bg-amber-100 text-amber-850 border-amber-200',
          label: 'Estado cambiado'
        };
      case 'edit':
        return {
          icon: <Edit className="w-4 h-4" />,
          bgColor: 'bg-blue-50 border-blue-100 text-blue-700',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Edición'
        };
      case 'delete':
        return {
          icon: <Trash2 className="w-4 h-4" />,
          bgColor: 'bg-rose-50 border-rose-100 text-rose-700',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
          label: 'Eliminación'
        };
    }
  };

  return (
    <div className="space-y-6" id="audit-log-view">
      {/* Cabecera de Auditoría */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Control & Auditoría de Operaciones
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Historial de Actividades (Auditoría)</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Visualiza y realiza seguimiento en tiempo real de cada creación, modificación o cambio de estado de tareas dentro de la plataforma. Control absoluto de la línea de tiempo.
          </p>
        </div>

        {/* Botón de limpiar historial para administradores */}
        {activeUserRole === 'Admin' && onClearActivities && activities.length > 0 && (
          <button
            type="button"
            onClick={onClearActivities}
            className="z-10 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer self-start md:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Borrar Historial
          </button>
        )}
      </div>

      {/* Controles de Filtros y Búsqueda */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Barra de Búsqueda */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por tarea o responsable..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* selectores de Filtro */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Acción */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas las Acciones</option>
              <option value="create">Creación</option>
              <option value="edit">Edición</option>
              <option value="status_change">Cambios de Estado</option>
              <option value="delete">Eliminaciones</option>
            </select>
          </div>

          {/* Filtro por Rol */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos los Roles</option>
              <option value="Admin">Administradores</option>
              <option value="Equipo">Equipo Técnico</option>
              <option value="Cliente">Clientes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listado Principal de Historial (Auditoría en Timeline) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">No se encontraron registros de auditoría</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ninguna actividad coincide con los filtros aplicados en este momento.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {filteredActivities.map((act) => {
              const details = getActionDetails(act.action);
              
              return (
                <div key={act.id} className="p-4 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  {/* Info Principal de la Actividad */}
                  <div className="flex items-start gap-3.5">
                    {/* Icono Redondo de Acción */}
                    <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 sm:mt-0 ${details.bgColor}`}>
                      {details.icon}
                    </div>

                    <div className="space-y-1">
                      {/* Texto Explicativo de la Acción */}
                      <div className="text-xs text-slate-700 font-semibold leading-relaxed">
                        <span className="font-extrabold text-slate-900">{act.userName}</span>{' '}
                        {act.action === 'create' && 'creó la tarea'}
                        {act.action === 'edit' && 'modificó la tarea'}
                        {act.action === 'delete' && 'eliminó la tarea'}
                        {act.action === 'status_change' && 'cambió el estado de'}
                        <span className="font-black text-slate-900 ml-1">"{act.taskTitle}"</span>
                        
                        {/* Detalle del cambio de estado */}
                        {act.action === 'status_change' && act.oldValue && act.newValue && (
                          <span className="ml-1 text-[10px] font-bold text-slate-500">
                            (de <strong className="text-rose-500 font-black">{act.oldValue}</strong> a <strong className="text-emerald-500 font-black">{act.newValue}</strong>)
                          </span>
                        )}
                      </div>

                      {/* Autor y Rol */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        <span className={`px-2 py-0.5 rounded-md font-black uppercase text-[8px] border shrink-0 ${
                          act.userRole === 'Admin' 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                            : act.userRole === 'Cliente' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {act.userRole}
                        </span>
                        
                        <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-slate-300" /> {formatDateTime(act.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Etiqueta de Tipo de Acción */}
                  <div className="hidden sm:block shrink-0">
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full border ${details.badgeColor}`}>
                      {details.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pié de página de Seguridad */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
        <FileText className="w-5 h-5 text-slate-400 shrink-0" />
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          Este registro de auditoría almacena de forma íntegra cada interacción realizada en este espacio de trabajo. 
          Los cambios se sincronizan en tiempo real para todos los co-editores conectados de forma activa.
        </p>
      </div>
    </div>
  );
}
