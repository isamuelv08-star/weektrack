import React, { useState } from 'react';
import { Task, Company } from '../types';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, Plus } from 'lucide-react';
import { TYPE_COLORS } from './TaskModal';

interface CalendarViewProps {
  tasks: Task[];
  companies: Company[];
  onSelectTask: (task: Task) => void;
  onNewTaskWithDate?: (dateStr: string) => void;
  selectedCompanyId: string; // Para filtros aplicados en el layout principal
  searchQuery: string;
  selectedType: string;
  selectedStatus: string;
  selectedPriority: string;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarView({
  tasks,
  companies,
  onSelectTask,
  onNewTaskWithDate,
  selectedCompanyId,
  searchQuery,
  selectedType,
  selectedStatus,
  selectedPriority,
}: CalendarViewProps) {
  // Inicializar en la fecha actual del sistema
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Filtrar las tareas que coincidan con los filtros globales
  const filteredTasks = tasks.filter((t) => {
    const matchesCompany = selectedCompanyId === 'all' || t.companyId === selectedCompanyId;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCompany && matchesType && matchesStatus && matchesPriority && matchesSearch;
  });

  // Navegación
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  // Lógica de cuadrícula de calendario
  // Obtener el primer día de la semana para el primer día del mes (Lunes = 0, Domingo = 6)
  const firstDayOfMonth = new Date(year, month, 1);
  let dayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adaptar a Lunes-Primero

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: { day: number; isCurrentMonth: boolean; dateString: string }[] = [];

  // Rellenar días del mes anterior
  for (let i = dayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarDays.push({ day: dayNum, isCurrentMonth: false, dateString: dateStr });
  }

  // Rellenar días del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ day: i, isCurrentMonth: true, dateString: dateStr });
  }

  // Rellenar días del mes siguiente para completar la cuadrícula (múltiplo de 7)
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ day: i, isCurrentMonth: false, dateString: dateStr });
  }

  // Determinar si una tarea cae en un día específico
  const getTasksForDay = (dateStr: string) => {
    return filteredTasks.filter((t) => {
      return dateStr >= t.startDate && dateStr <= t.endDate;
    });
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return dateStr === `${y}-${m}-${d}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[820px]" id="calendar-view-container">
      {/* Calendar Header Nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            {MONTHS[month]} <span className="text-slate-400 font-normal">{year}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToToday}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            Hoy
          </button>
          <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-150">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white text-slate-600 rounded-md transition-all cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white text-slate-600 rounded-md transition-all cursor-pointer"
              title="Siguiente mes"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekdays row */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-center py-2">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {day}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 overflow-y-auto min-h-0 bg-slate-100/20">
        {calendarDays.map(({ day, isCurrentMonth, dateString }, index) => {
          const dayTasks = getTasksForDay(dateString);
          const currentDayIsToday = isToday(dateString);

          return (
            <div
              key={`${dateString}-${index}`}
              className={`min-h-[125px] border-r border-b border-slate-100 p-2 flex flex-col group relative transition-colors ${
                isCurrentMonth ? 'bg-white' : 'bg-slate-50/40 text-slate-300'
              } ${currentDayIsToday ? 'bg-blue-50/25' : ''}`}
            >
              {/* Day Indicator */}
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                      currentDayIsToday
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                        : isCurrentMonth
                        ? 'text-slate-700 group-hover:bg-slate-100'
                        : 'text-slate-400'
                    }`}
                  >
                    {day}
                  </span>
                  {isCurrentMonth && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewTaskWithDate?.(dateString);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-all cursor-pointer border border-transparent hover:border-blue-200/50"
                      title="Añadir tarea para este día"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {dayTasks.length > 0 && isCurrentMonth && (
                  <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded-md sm:inline hidden">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Tasks Space */}
              <div className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
                {dayTasks.map((task) => {
                  const company = companies.find((c) => c.id === task.companyId);
                  const isTaskStart = task.startDate === dateString;
                  const companyColor = company?.color || '#3b82f6';

                  // Dynamic styles based on status
                  let bgStyle = `${companyColor}dd`;
                  let borderStyle = companyColor;
                  let textStyle = '#ffffff';
                  let decorationStyle = '';

                  if (task.status === 'Completado') {
                    bgStyle = '#f0fdf4'; // Light green
                    borderStyle = '#10b981'; // Green border
                    textStyle = '#15803d'; // Dark green text
                    decorationStyle = 'line-through opacity-75';
                  } else if (task.status === 'Por hacer') {
                    bgStyle = '#f8fafc'; // Pastel Slate
                    borderStyle = companyColor;
                    textStyle = '#334155';
                  } else if (task.status === 'Bloqueado') {
                    bgStyle = '#fff1f2'; // Reddish pink
                    borderStyle = '#f43f5e';
                    textStyle = '#be123c';
                  } else if (task.status === 'En revisión') {
                    bgStyle = '#fffbeb'; // Yellow/amber
                    borderStyle = '#f59e0b';
                    textStyle = '#b45309';
                  } else if (task.status === 'No se hizo') {
                    bgStyle = '#f4f4f5'; // Light zinc/grey
                    borderStyle = '#a1a1aa'; // Zinc border
                    textStyle = '#71717a'; // Zinc text
                    decorationStyle = 'line-through opacity-60';
                  }

                  // Dynamic priority dot styles
                  let priorityDotColor = '#94a3b8'; // default slate-400
                  if (task.priority === 'Alta') {
                    priorityDotColor = '#ef4444'; // Rojo sutil
                  } else if (task.priority === 'Media') {
                    priorityDotColor = '#f97316'; // Naranja
                  } else if (task.priority === 'Baja') {
                    priorityDotColor = '#10b981'; // Verde sutil
                  }

                  return (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task);
                      }}
                      className="cursor-pointer group/item relative"
                    >
                      {/* Pastilla de color */}
                      <div
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate shadow-xs border-l-2 transition-all hover:brightness-95 flex items-center justify-between gap-1 ${decorationStyle}`}
                        style={{
                          backgroundColor: bgStyle,
                          borderColor: borderStyle,
                          color: textStyle,
                        }}
                        title={`${company?.name || 'Cliente'}: ${task.title} [${task.priority}] (${task.progress}%)`}
                      >
                        <span className="truncate flex-1 flex items-center gap-1.5">
                          <span 
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: priorityDotColor }}
                          />
                          <span className="truncate">{isTaskStart ? `• ${task.title}` : task.title}</span>
                        </span>
                        {task.checklist && task.checklist.length > 0 && (
                          <span className="text-[8px] opacity-90 font-mono hidden sm:inline">
                            {task.checklist.filter((s) => s.completed).length}/{task.checklist.length}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
