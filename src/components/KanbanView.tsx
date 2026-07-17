import React, { useState } from 'react';
import { Task, Company, TaskStatus, TaskPriority } from '../types';
import { TYPE_COLORS, PRIORITY_COLORS } from './TaskModal';
import { Calendar, ChevronLeft, ChevronRight, CheckSquare, Clock, AlertOctagon, HelpCircle, Eye, Activity, CheckCircle2, XCircle } from 'lucide-react';

interface KanbanViewProps {
  tasks: Task[];
  companies: Company[];
  onSelectTask: (task: Task) => void;
  onUpdateTaskStatus: (id: string, newStatus: TaskStatus) => void;
  selectedCompanyId: string;
  searchQuery: string;
  selectedType: string;
  selectedStatus: string;
  selectedPriority: string;
}

const COLUMNS: { id: TaskStatus; label: string; bg: string; border: string; text: string; icon: React.ReactNode }[] = [
  { id: 'Por hacer', label: 'Por hacer', bg: 'bg-slate-50/50', border: 'border-slate-200/80', text: 'text-slate-700', icon: <Clock className="w-4 h-4 text-slate-500" /> },
  { id: 'En proceso', label: 'En proceso', bg: 'bg-amber-50/15', border: 'border-amber-200/60', text: 'text-amber-700', icon: <Activity className="w-4 h-4 text-amber-500 animate-pulse" /> },
  { id: 'En revisión', label: 'En revisión', bg: 'bg-indigo-50/15', border: 'border-indigo-200/60', text: 'text-indigo-700', icon: <Eye className="w-4 h-4 text-indigo-500" /> },
  { id: 'Completado', label: 'Completado', bg: 'bg-emerald-50/15', border: 'border-emerald-200/60', text: 'text-emerald-700', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  { id: 'Bloqueado', label: 'Bloqueado', bg: 'bg-rose-50/15', border: 'border-rose-200/60', text: 'text-rose-700', icon: <AlertOctagon className="w-4 h-4 text-rose-500 animate-bounce" /> },
  { id: 'No se hizo', label: 'No se hizo', bg: 'bg-zinc-100/40', border: 'border-zinc-300/60', text: 'text-zinc-600', icon: <XCircle className="w-4 h-4 text-zinc-500" /> },
];

export default function KanbanView({
  tasks,
  companies,
  onSelectTask,
  onUpdateTaskStatus,
  selectedCompanyId,
  searchQuery,
  selectedType,
  selectedStatus,
  selectedPriority,
}: KanbanViewProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Filtrar tareas que correspondan a los filtros globales de la app
  const filteredTasks = tasks.filter((t) => {
    const matchesCompany = selectedCompanyId === 'all' || t.companyId === selectedCompanyId;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCompany && matchesType && matchesStatus && matchesPriority && matchesSearch;
  });

  // Funciones de Drag & Drop nativas de HTML5
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Permitir soltar
  };

  const handleDrop = (columnId: TaskStatus) => {
    if (draggedTaskId) {
      onUpdateTaskStatus(draggedTaskId, columnId);
      setDraggedTaskId(null);
    }
  };

  // Mover de estado con botones de flecha (accesibilidad y móvil)
  const shiftStatus = (taskId: string, currentStatus: TaskStatus, direction: 'prev' | 'next') => {
    const statusOrder: TaskStatus[] = ['Por hacer', 'En proceso', 'En revisión', 'Completado', 'Bloqueado', 'No se hizo'];
    const idx = statusOrder.indexOf(currentStatus);
    let nextIdx = idx + (direction === 'next' ? 1 : -1);
    if (nextIdx >= 0 && nextIdx < statusOrder.length) {
      onUpdateTaskStatus(taskId, statusOrder[nextIdx]);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 select-none min-h-[68vh] w-full snap-x scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent" id="kanban-view-container">
      {COLUMNS.map((col) => {
        const colTasks = filteredTasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(col.id)}
            className={`flex flex-col flex-shrink-0 w-[290px] sm:w-[310px] md:w-[325px] rounded-2xl border ${col.border} ${col.bg} p-4 max-h-[75vh] shadow-xs snap-align-start transition-all`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-dashed border-slate-200/80">
              <div className="flex items-center gap-2">
                {col.icon}
                <span className={`text-xs font-extrabold uppercase tracking-wider ${col.text}`}>{col.label}</span>
                <span className="bg-white/85 border border-slate-200/60 text-slate-500 font-bold text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs">
                  {colTasks.length}
                </span>
              </div>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {colTasks.map((task) => {
                const company = companies.find((c) => c.id === task.companyId);
                const companyColor = company?.color || '#cbd5e1';
                const hasChecklist = task.checklist && task.checklist.length > 0;
                const completedCount = hasChecklist ? task.checklist.filter((s) => s.completed).length : 0;
                const totalCount = hasChecklist ? task.checklist.length : 0;
                const isCompleted = task.status === 'Completado';
                const isBlocked = task.status === 'Bloqueado';
                const isNotDone = task.status === 'No se hizo';

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => onSelectTask(task)}
                    className={`group p-4 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing relative flex flex-col gap-2.5 shadow-xs hover:-translate-y-0.5 ${
                      isCompleted 
                        ? 'bg-emerald-50/20 border-emerald-200 hover:border-emerald-300 hover:shadow-md' 
                        : isBlocked
                        ? 'bg-rose-50/20 border-rose-200/80 hover:border-rose-300 hover:shadow-md'
                        : isNotDone
                        ? 'bg-zinc-50/50 border-zinc-200/80 opacity-75 hover:opacity-100 hover:border-zinc-300 hover:shadow-sm'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                    }`}
                    id={`kanban-card-${task.id}`}
                  >
                    {/* Company Tag Accent */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[9px] font-extrabold text-white px-2 py-0.5 rounded-sm truncate max-w-[130px] uppercase tracking-wider shadow-2xs"
                        style={{ backgroundColor: companyColor }}
                      >
                        {company?.name || 'Cliente'}
                      </span>
                      <span className={`text-[9px] font-extrabold border px-2 py-0.5 rounded-full uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>

                    {/* Task Title */}
                    <h4 className={`text-sm font-extrabold line-clamp-2 leading-tight transition-colors ${
                      isCompleted 
                        ? 'text-emerald-800 line-through decoration-emerald-500/40 opacity-75' 
                        : isBlocked
                        ? 'text-rose-950'
                        : isNotDone
                        ? 'text-slate-400 line-through decoration-zinc-300'
                        : 'text-slate-800 group-hover:text-blue-600'
                    }`}>
                      {task.title}
                    </h4>

                    {/* Metadata indicators */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded-md border ${TYPE_COLORS[task.type]}`}>
                        {task.type}
                      </span>
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{task.endDate.split('-').slice(1).join('/')}</span>
                      </div>
                    </div>

                    {/* Checklist and Progress Bar */}
                    {hasChecklist ? (
                      <div className="space-y-1.5 mt-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-1 font-bold text-slate-500">
                            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                            {completedCount}/{totalCount} Subtareas
                          </span>
                          <span className={`font-extrabold ${isCompleted ? 'text-emerald-600' : isNotDone ? 'text-zinc-500' : 'text-blue-600'}`}>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-emerald-500' 
                                : isBlocked 
                                ? 'bg-rose-500' 
                                : isNotDone 
                                ? 'bg-zinc-400' 
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      isCompleted && (
                        <div className="flex items-center justify-between text-[10px] text-emerald-600 mt-1 font-bold">
                          <span>Completado</span>
                          <span>100%</span>
                        </div>
                      )
                    )}

                    {/* Column Quick Shift buttons */}
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shiftStatus(task.id, task.status, 'prev');
                        }}
                        disabled={col.id === 'Por hacer'}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg disabled:opacity-20 cursor-pointer active:scale-95 transition-all"
                        title="Mover a columna anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Arrastrar o mover</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shiftStatus(task.id, task.status, 'next');
                        }}
                        disabled={col.id === 'No se hizo'}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg disabled:opacity-20 cursor-pointer active:scale-95 transition-all"
                        title="Mover a columna siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-200/80 rounded-xl text-xs text-slate-400/80 italic font-medium">
                  Columna vacía
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
