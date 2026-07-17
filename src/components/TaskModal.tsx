import React, { useState, useEffect } from 'react';
import { Task, Company, TaskType, TaskStatus, TaskPriority, SubTask, Comment, TaskTemplate } from '../types';
import { X, Plus, Trash2, Copy, CheckSquare, Calendar, AlertTriangle, Layers, AlignLeft, MessageSquare, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFeedback } from './FeedbackProvider';


interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null; // null si es creación de nueva tarea
  companies: Company[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (task: Task) => void;
  defaultDate?: string; // Por si hacemos doble click o click en un día del calendario
  activeUserRole: 'Admin' | 'Equipo' | 'Cliente';
  activeUserName: string;
  isApproved?: boolean;
  templates?: TaskTemplate[];
  onSaveTemplate?: (template: TaskTemplate) => void;
  onDeleteTemplate?: (id: string) => void;
  defaultCompanyId?: string;
}

const TASK_TYPES: TaskType[] = ['Contenido', 'Pauta', 'CRM', 'Reunión', 'Entrega', 'Administrativo', 'Otro'];
const TASK_STATUSES: TaskStatus[] = ['Por hacer', 'En proceso', 'En revisión', 'Completado', 'Bloqueado'];
const TASK_PRIORITIES: TaskPriority[] = ['Alta', 'Media', 'Baja'];

export const TYPE_COLORS: Record<TaskType, string> = {
  Contenido: 'bg-amber-100 text-amber-800 border-amber-200',
  Pauta: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CRM: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Reunión: 'bg-purple-100 text-purple-800 border-purple-200',
  Entrega: 'bg-sky-100 text-sky-800 border-sky-200',
  Administrativo: 'bg-rose-100 text-rose-800 border-rose-200',
  Otro: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  Alta: 'text-rose-700 bg-rose-50/50 border-rose-200/80',
  Media: 'text-amber-700 bg-amber-50/50 border-amber-200/80',
  Baja: 'text-emerald-700 bg-emerald-50/50 border-emerald-200/80',
};

export const CHECKLIST_SUGGESTIONS: Record<TaskType, string[]> = {
  Contenido: [
    'Redactar copy y hashtags',
    'Diseño de artes gráficos',
    'Grabar reels o videos',
    'Aprobación del cliente',
    'Programar publicación',
  ],
  Pauta: [
    'Definir público objetivo',
    'Configurar campaña en Ads Manager',
    'Diseño de creativos y banners',
    'Instalación y prueba de Pixel',
    'Revisar presupuesto diario',
  ],
  CRM: [
    'Redactar secuencia de correos',
    'Diseñar plantilla HTML',
    'Segmentar base de datos',
    'Prueba de envío de test',
    'Activar automatización',
  ],
  Reunión: [
    'Definir agenda y objetivos',
    'Enviar invitación con link',
    'Preparar presentación / diapositivas',
    'Tomar minuta y acuerdos',
    'Enviar correo de seguimiento',
  ],
  Entrega: [
    'Revisión final de calidad',
    'Exportar entregables (Drive/ZIP)',
    'Redactar nota de entrega',
    'Enviar link de entrega',
    'Recibir feedback del cliente',
  ],
  Administrativo: [
    'Actualizar reporte de horas',
    'Enviar factura o recibo',
    'Archivar documentación',
    'Revisar métricas de la semana',
    'Planificar próxima semana',
  ],
  Otro: [
    'Investigación previa',
    'Reunión de alineación interna',
    'Ajustar calendario',
    'Revisión de competidores',
  ],
};

export default function TaskModal({
  isOpen,
  onClose,
  task,
  companies,
  onSaveTask,
  onDeleteTask,
  onDuplicateTask,
  defaultDate,
  activeUserRole,
  activeUserName,
  isApproved = true,
  templates = [],
  onSaveTemplate,
  onDeleteTemplate,
  defaultCompanyId,
}: TaskModalProps) {
  const { showConfirm, showToast } = useFeedback();
  const [companyId, setCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('Contenido');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Por hacer');
  const [priority, setPriority] = useState<TaskPriority>('Media');
  
  // Checklist de subtareas
  const [checklist, setChecklist] = useState<SubTask[]>([]);
  const [newSubTaskText, setNewSubTaskText] = useState('');

  // Comentarios
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // --- ESTADOS DE PLANTILLA ---
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplTitleTemplate, setTplTitleTemplate] = useState('');

  const handleApplyTemplate = (tpl: TaskTemplate) => {
    const company = companies.find((c) => c.id === companyId);
    const clientName = company ? company.name : 'Cliente';
    const finalTitle = tpl.titleTemplate.replace(/{Cliente}/g, clientName).replace(/{Client}/g, clientName);

    setTitle(finalTitle);
    setDescription(tpl.taskDescription);
    setType(tpl.type);
    setPriority(tpl.priority);

    // Calcular fechas relativas
    const baseDate = defaultDate ? new Date(defaultDate + 'T12:00:00') : new Date();
    const start = new Date(baseDate.getTime() + tpl.relativeDaysStart * 24 * 60 * 60 * 1000);
    const end = new Date(baseDate.getTime() + tpl.relativeDaysEnd * 24 * 60 * 60 * 1000);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);

    // Generar checklist con subtareas de la plantilla
    const newChecklist: SubTask[] = tpl.checklist.map((text, idx) => ({
      id: `sub-${Date.now()}-${idx}`,
      text: text,
      completed: false
    }));
    setChecklist(newChecklist);

    showToast(`¡Plantilla "${tpl.name}" aplicada con éxito!`, 'success');
  };

  const handleOpenSaveTemplate = () => {
    let suggestedTitleTemplate = title || 'Nueva Tarea de {Cliente}';
    if (companyId) {
      const comp = companies.find(c => c.id === companyId);
      if (comp && title.includes(comp.name)) {
        suggestedTitleTemplate = title.replace(new RegExp(comp.name, 'g'), '{Cliente}');
      }
    }
    setTplTitleTemplate(suggestedTitleTemplate);
    setTplName('');
    setTplDesc('');
    setIsSavingTemplate(true);
  };

  const handleConfirmSaveTemplate = () => {
    if (!tplName.trim()) {
      showToast('Por favor introduce un nombre para la plantilla.', 'error');
      return;
    }
    if (onSaveTemplate) {
      const newTpl: TaskTemplate = {
        id: `tpl-${Date.now()}`,
        name: tplName.trim(),
        description: tplDesc.trim() || 'Plantilla de hito creada por el usuario',
        titleTemplate: tplTitleTemplate.trim() || title,
        taskDescription: description.trim(),
        type,
        priority,
        checklist: checklist.map(s => s.text),
        relativeDaysStart: 0,
        relativeDaysEnd: 7
      };
      onSaveTemplate(newTpl);
      setIsSavingTemplate(false);
    }
  };

  // Sincronizar estado cuando se abre o cambia la tarea seleccionada
  useEffect(() => {
    if (task) {
      setCompanyId(task.companyId);
      setTitle(task.title);
      setDescription(task.description);
      setType(task.type);
      setStartDate(task.startDate);
      setEndDate(task.endDate);
      setStatus(task.status);
      setPriority(task.priority);
      setChecklist(task.checklist || []);
      setComments(task.comments || []);
    } else {
      // Nueva tarea con valores predeterminados
      const initialCompanyId = defaultCompanyId && companies.some((c) => c.id === defaultCompanyId)
        ? defaultCompanyId
        : (companies[0]?.id || '');
      setCompanyId(initialCompanyId);
      setTitle('');
      setDescription('');
      setType('Contenido');
      const today = defaultDate || new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setStatus('Por hacer');
      setPriority('Media');
      setChecklist([]);
      setComments([]);
    }
    setNewSubTaskText('');
  }, [task, isOpen, companies, defaultDate, defaultCompanyId]);

  // Manejo de la adición de una subtarea
  const handleAddSubTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTaskText.trim()) return;
    const newSub: SubTask = {
      id: `sub-${Date.now()}`,
      text: newSubTaskText.trim(),
      completed: false,
    };
    setChecklist([...checklist, newSub]);
    setNewSubTaskText('');
  };

  // Cambiar estado de una subtarea
  const toggleSubTask = (id: string) => {
    setChecklist(
      checklist.map((sub) => (sub.id === id ? { ...sub, completed: !sub.completed } : sub))
    );
  };

  // Eliminar subtarea
  const deleteSubTask = (id: string) => {
    setChecklist(checklist.filter((sub) => sub.id !== id));
  };

  // Añadir un comentario
  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      authorName: activeUserName,
      authorRole: activeUserRole,
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    };
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setNewCommentText('');
    
    // Auto-salvado instantáneo para simulación en vivo
    if (task) {
      onSaveTask({
        ...task,
        checklist,
        comments: updatedComments,
      });
    }
  };

  // Guardar tarea principal
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !title.trim()) return;

    // Calcular progreso
    let progress = 0;
    if (checklist.length > 0) {
      const completedCount = checklist.filter((s) => s.completed).length;
      progress = Math.round((completedCount / checklist.length) * 100);
    } else if (status === 'Completado') {
      progress = 100;
    } else if (status === 'Por hacer') {
      progress = 0;
    } else {
      // Si está En proceso/En revisión sin checklist, mantiene el anterior o se deja en 50
      progress = task ? task.progress : 50;
    }

    const savedTask: Task = {
      id: task ? task.id : `task-${Date.now()}`,
      companyId,
      title: title.trim(),
      description: description.trim(),
      type,
      startDate,
      endDate: endDate < startDate ? startDate : endDate, // Garantizar fecha_fin >= fecha_inicio
      status,
      priority,
      checklist,
      progress,
      comments,
    };

    onSaveTask(savedTask);
    onClose();
  };

  if (!isOpen) return null;

  const currentCompany = companies.find((c) => c.id === companyId);
  const completedSubTasks = checklist.filter((s) => s.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedSubTasks / checklist.length) * 100) : 0;

  const getDeadlineAlert = () => {
    if (!endDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate + 'T12:00:00');
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (status === 'Completado') {
      return {
        bg: 'bg-emerald-50/50 border-emerald-200 text-emerald-800 border-l-4 border-l-emerald-500',
        title: 'Entregable Completado',
        desc: 'Este hito se encuentra finalizado y registrado de forma exitosa en el panel de control.',
      };
    }

    let titleStr = '';
    let descStr = '';
    let bgStr = '';

    const pStr = priority === 'Alta' ? 'Prioridad Alta' : priority === 'Media' ? 'Prioridad Media' : 'Prioridad Baja';

    if (diffDays < 0) {
      titleStr = `Entrega Retrasada (${pStr})`;
      descStr = `El plazo de entrega estimado venció hace ${Math.abs(diffDays)} día(s). Se recomienda reajustar esfuerzos o coordinar con el equipo.`;
      bgStr = 'bg-rose-50/50 border-rose-200 text-rose-800 border-l-4 border-l-rose-500';
    } else if (diffDays === 0) {
      titleStr = `Entrega Planificada para Hoy (${pStr})`;
      descStr = 'La fecha límite de este entregable es el día de hoy. Por favor, valide los avances con el cliente.';
      bgStr = 'bg-amber-50/50 border-amber-200 text-amber-900 border-l-4 border-l-amber-500';
    } else if (diffDays <= 2) {
      titleStr = `Plazo de Entrega Próximo (${pStr})`;
      descStr = `Quedan solo ${diffDays} día(s) para realizar la entrega acordada de este hito.`;
      bgStr = priority === 'Alta' 
        ? 'bg-rose-50/50 border-rose-200 text-rose-800 border-l-4 border-l-rose-500' 
        : 'bg-amber-50/50 border-amber-200 text-amber-800 border-l-4 border-l-amber-500';
    } else {
      titleStr = `Hito en Progreso (${pStr})`;
      descStr = `Cuentas con ${diffDays} días restantes para completar las actividades de este hito de seguimiento.`;
      bgStr = 'bg-blue-50/50 border-blue-150 text-blue-800 border-l-4 border-l-blue-500';
    }

    return { bg: bgStr, title: titleStr, desc: descStr };
  };

  const deadlineAlert = getDeadlineAlert();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          id="task-modal-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: currentCompany?.color || '#cbd5e1' }}
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-800" id="task-modal-title">
                  {task ? 'Detalle de la Tarea' : 'Nueva Tarea de Planificación'}
                </h3>
                <p className="text-xs text-slate-500">
                  {task ? 'Edita los parámetros o actualiza el avance' : 'Define un nuevo hito mensual'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {task && (
                <button
                  type="button"
                  onClick={() => {
                    onDuplicateTask(task);
                    onClose();
                  }}
                  title="Duplicar Tarea (Recurrente)"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Duplicar</span>
                </button>
              )}
              <button
                id="close-task-modal-btn"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto flex flex-col">
            {/* Banner de Rol Contextual */}
            <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs font-semibold">
              {activeUserRole === 'Admin' && (
                <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-blue-100">
                  🌟 <strong>Modo Administrador:</strong> Control total de planificación ({activeUserName})
                </span>
              )}
              {activeUserRole === 'Equipo' && (
                <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-indigo-100">
                  👥 <strong>Modo Equipo:</strong> Editor de avances y comentarios ({activeUserName})
                </span>
              )}
              {activeUserRole === 'Cliente' && (
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-emerald-100 animate-pulse">
                  💼 <strong>Modo Consulta (Cliente):</strong> Verificando entregables y comentarios habilitados
                </span>
              )}
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Sesión de WeekTrack</span>
            </div>

            <div className="p-6 space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Panel Izquierdo / Campos principales */}
                <div className="md:col-span-2 space-y-4">
                  {deadlineAlert && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all text-xs shadow-xs ${deadlineAlert.bg}`}>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold uppercase tracking-wider text-[11px] leading-tight">{deadlineAlert.title}</h4>
                        <p className="font-medium leading-relaxed opacity-90">{deadlineAlert.desc}</p>
                      </div>
                    </div>
                  )}

                  {/* Smart-Fill / Plantillas de Hito */}
                  {!task && templates && templates.length > 0 && (
                    <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/15 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                          ¿Comenzar con una Plantilla Profesional?
                        </span>
                        <span className="text-[9px] font-bold text-blue-500/80 bg-blue-50/80 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Smart-Fill
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {templates.map((tpl) => (
                          <div
                            key={tpl.id}
                            className="group p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 bg-white hover:bg-blue-50/30 transition-all flex items-start justify-between gap-2 cursor-pointer relative"
                            onClick={() => handleApplyTemplate(tpl)}
                          >
                            <div className="space-y-1 pr-4 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                                  {tpl.name}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-600 transition-colors">
                                {tpl.description}
                              </p>
                              <div className="flex items-center gap-1 pt-1.5">
                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
                                  {tpl.type}
                                </span>
                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded uppercase tracking-wider">
                                  {tpl.priority}
                                </span>
                              </div>
                            </div>

                            {/* Botón Eliminar Plantilla Personalizada */}
                            {onDeleteTemplate && !['tpl-1', 'tpl-2', 'tpl-3', 'tpl-4'].includes(tpl.id) && (
                              <button
                                type="button"
                                title="Eliminar plantilla"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirm({
                                    title: '¿Eliminar plantilla?',
                                    message: `¿Estás seguro de que deseas eliminar la plantilla "${tpl.name}" permanentemente?`,
                                    confirmText: 'Sí, eliminar',
                                    cancelText: 'Cancelar',
                                    type: 'danger',
                                    onConfirm: () => {
                                      onDeleteTemplate(tpl.id);
                                    }
                                  });
                                }}
                                className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95 cursor-pointer flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Título de la Tarea *
                    </label>
                    <input
                      id="task-title-input"
                      type="text"
                      required
                      disabled={activeUserRole === 'Cliente'}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Lanzamiento campaña Meta Ads..."
                      className="w-full px-3.5 py-2.5 text-base font-medium border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Descripción de Trabajo
                    </label>
                    <div className="relative">
                      <AlignLeft className="absolute top-3 left-3 w-4 h-4 text-slate-400" />
                      <textarea
                        id="task-description-input"
                        value={description}
                        disabled={activeUserRole === 'Cliente'}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Escribe detalles, links de recursos, metodología Growth Scaling a aplicar o especificaciones para el equipo..."
                        rows={3}
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white resize-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Checklist Section */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <CheckSquare className="w-4 h-4 text-slate-400" />
                        Checklist de Avance ({completedSubTasks}/{checklist.length})
                      </label>
                      {checklist.length > 0 && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {progressPercent}%
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {checklist.length > 0 && (
                      <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    )}

                    {/* List of Subtasks */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-3">
                      {checklist.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition-colors group"
                        >
                          <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => toggleSubTask(sub.id)}
                              className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={sub.completed ? 'line-through text-slate-400' : ''}>
                              {sub.text}
                            </span>
                          </label>
                          {activeUserRole !== 'Cliente' && (
                            <button
                              type="button"
                              onClick={() => deleteSubTask(sub.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {checklist.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-2">
                          No hay ítems en el checklist. Agrega subtareas para medir el % de avance de forma automática.
                        </p>
                      )}
                    </div>

                    {/* Add Subtask Form */}
                    {activeUserRole !== 'Cliente' && (
                      <div className="space-y-2.5">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubTaskText}
                            onChange={(e) => setNewSubTaskText(e.target.value)}
                            placeholder="Nueva subtarea (ej: Redactar copys)..."
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newSubTaskText.trim()) {
                                  const newSub: SubTask = {
                                    id: `sub-${Date.now()}`,
                                    text: newSubTaskText.trim(),
                                    completed: false,
                                  };
                                  setChecklist([...checklist, newSub]);
                                  setNewSubTaskText('');
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (newSubTaskText.trim()) {
                                const newSub: SubTask = {
                                  id: `sub-${Date.now()}`,
                                  text: newSubTaskText.trim(),
                                  completed: false,
                                };
                                setChecklist([...checklist, newSub]);
                                setNewSubTaskText('');
                              }
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Agregar
                          </button>
                        </div>

                        {/* Suggestions Area */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Sugerencias rápidas de {type}:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {CHECKLIST_SUGGESTIONS[type]?.map((item, idx) => {
                              const isAlreadyAdded = checklist.some(
                                (sub) => sub.text.toLowerCase().trim() === item.toLowerCase().trim()
                              );
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={isAlreadyAdded}
                                  onClick={() => {
                                    const newSub: SubTask = {
                                      id: `sub-${Date.now()}-${idx}`,
                                      text: item,
                                      completed: false,
                                    };
                                    setChecklist([...checklist, newSub]);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer select-none active:scale-95 ${
                                    isAlreadyAdded
                                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                                      : 'bg-blue-50/50 hover:bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-200'
                                  }`}
                                >
                                  {isAlreadyAdded ? '✓ ' : '+ '}
                                  {item}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Canal de Comentarios de Colaboración */}
                  <div className="pt-4 border-t border-slate-150 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        Comentarios y Feedback ({comments.length})
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">Tiempo Real</span>
                    </div>

                    {/* Lista de comentarios */}
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                      {comments.map((c) => {
                        const isMyComment = c.authorName === activeUserName;
                        const roleMeta = {
                          Admin: { label: 'Líder Sistema', color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
                          Equipo: { label: 'Equipo Técnico', color: 'bg-indigo-50 text-indigo-700 border-indigo-200/60' },
                          Cliente: { label: 'Gerente Cliente', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
                        };
                        const meta = roleMeta[c.authorRole] || { label: 'Colaborador', color: 'bg-slate-50 text-slate-600 border-slate-200' };

                        return (
                          <div 
                            key={c.id} 
                            className={`p-3 rounded-xl border transition-all ${
                              isMyComment 
                                ? 'bg-slate-50/70 border-slate-200/80' 
                                : 'bg-white border-slate-100 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-700">{c.authorName}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${meta.color}`}>
                                  {meta.label}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">{c.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{c.text}</p>
                          </div>
                        );
                      })}

                      {comments.length === 0 && (
                        <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-xs text-slate-400 italic font-medium">No hay comentarios en este entregable.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Usa la caja inferior para dejar consultas o aprobaciones directas.</p>
                        </div>
                      )}
                    </div>

                    {/* Formulario de envío */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Escribe un comentario..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddComment}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-bold cursor-pointer flex items-center justify-center"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>

                </div>

                {/* Panel Derecho / Metadatos */}
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  {/* Empresa */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Cliente / Empresa
                    </label>
                    <select
                      id="task-company-select"
                      required
                      disabled={activeUserRole === 'Cliente'}
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>Selecciona un cliente</option>
                      {companies.filter(c => c.status === 'activa').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de Tarea */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Tipo de Entregable
                    </label>
                    <select
                      id="task-type-select"
                      disabled={activeUserRole === 'Cliente'}
                      value={type}
                      onChange={(e) => setType(e.target.value as TaskType)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      {TASK_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Estado Actual
                    </label>
                    <select
                      id="task-status-select"
                      disabled={activeUserRole === 'Cliente'}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TaskStatus)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prioridad */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Prioridad de Negocio
                    </label>
                    <select
                      id="task-priority-select"
                      disabled={activeUserRole === 'Cliente'}
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fechas */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      Planificación Temporal
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Fecha Inicio</label>
                      <input
                        id="task-startdate-input"
                        type="date"
                        required
                        disabled={activeUserRole === 'Cliente'}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Fecha Límite</label>
                      <input
                        id="task-enddate-input"
                        type="date"
                        required
                        disabled={activeUserRole === 'Cliente'}
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {task && activeUserRole === 'Admin' && (
                  <button
                    id="delete-task-btn"
                    type="button"
                    onClick={() => {
                      showConfirm({
                        title: '¿Eliminar tarea?',
                        message: '¿Estás seguro de que deseas eliminar esta tarea permanentemente?',
                        confirmText: 'Sí, eliminar',
                        cancelText: 'Cancelar',
                        type: 'danger',
                        onConfirm: () => {
                          onDeleteTask(task.id);
                          onClose();
                        }
                      });
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Eliminar Tarea
                  </button>
                )}
                {activeUserRole !== 'Cliente' && onSaveTemplate && (
                  <button
                    type="button"
                    onClick={handleOpenSaveTemplate}
                    title="Guardar esta configuración actual como una nueva plantilla"
                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Guardar como Plantilla</span>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {activeUserRole === 'Cliente' ? 'Cerrar Vista' : 'Cancelar'}
                </button>
                {activeUserRole !== 'Cliente' && (
                  <button
                    id="save-task-btn"
                    type="submit"
                    disabled={!isApproved}
                    className={`px-5 py-2 font-semibold rounded-xl text-xs transition-colors cursor-pointer ${
                      !isApproved 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-350' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10'
                    }`}
                  >
                    {!isApproved ? 'Esperando Aprobación...' : task ? 'Guardar Cambios' : 'Crear Tarea'}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Overlay Formulario para Guardar Plantilla */}
          <AnimatePresence>
            {isSavingTemplate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-xs p-6 flex items-center justify-center"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 w-full max-w-md space-y-4 text-left"
                >
                  <div className="flex items-center gap-2 text-blue-800">
                    <Sparkles className="w-5 h-5 text-blue-500 animate-bounce" />
                    <h4 className="font-extrabold text-sm uppercase tracking-wider">Crear Nueva Plantilla</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Guarda los campos actuales (Tipo, Prioridad, Checklist de Subtareas y Descripción) como una plantilla reutilizable para acelerar tu flujo de trabajo.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Nombre de la Plantilla *
                      </label>
                      <input
                        type="text"
                        required
                        value={tplName}
                        onChange={(e) => setTplName(e.target.value)}
                        placeholder="Ej: Setup de Landing Page..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Descripción Breve
                      </label>
                      <input
                        type="text"
                        value={tplDesc}
                        onChange={(e) => setTplDesc(e.target.value)}
                        placeholder="Ej: Actividades iniciales de maquetación..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Plantilla de Título (Usa {'{Cliente}'} para autocompletar)
                      </label>
                      <input
                        type="text"
                        value={tplTitleTemplate}
                        onChange={(e) => setTplTitleTemplate(e.target.value)}
                        placeholder="Ej: Landing Page - {Cliente}"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-mono text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsSavingTemplate(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSaveTemplate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      Guardar Plantilla
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
