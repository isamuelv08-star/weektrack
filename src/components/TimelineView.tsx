import React, { useRef, useEffect } from 'react';
import { Task, Company } from '../types';
import { TYPE_COLORS } from './TaskModal';
import { Calendar, HelpCircle, Activity } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  companies: Company[];
  onSelectTask: (task: Task) => void;
  selectedCompanyId: string;
  searchQuery: string;
  selectedType: string;
  selectedStatus: string;
  selectedPriority: string;
}

export default function TimelineView({
  tasks,
  companies,
  onSelectTask,
  selectedCompanyId,
  searchQuery,
  selectedType,
  selectedStatus,
  selectedPriority,
}: TimelineViewProps) {
  const year = 2026;
  const month = 6; // Julio (0-indexed)
  const daysInMonth = 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Referencia para hacer scroll automático hacia el día de hoy (día 13 de Julio) al cargar
  const timelineGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timelineGridRef.current) {
      // Desplazar horizontalmente al día de hoy (día 13 de Julio aprox) para centrar
      const cellWidth = 45; // Ancho aproximado de cada columna de día
      const sidebarWidth = 200; // Ancho de la barra lateral de empresas
      const scrollPosition = (13 - 1) * cellWidth - (timelineGridRef.current.clientWidth - sidebarWidth) / 2;
      timelineGridRef.current.scrollLeft = Math.max(0, scrollPosition);
    }
  }, []);

  // Filtrar las tareas correspondientes a Julio de 2026 y filtros globales
  const filteredTasks = tasks.filter((t) => {
    // Validar si la tarea cae o se cruza con Julio de 2026
    const startYMD = t.startDate.split('-');
    const endYMD = t.endDate.split('-');
    const startY = parseInt(startYMD[0]);
    const startM = parseInt(startYMD[1]) - 1;
    const endY = parseInt(endYMD[0]);
    const endM = parseInt(endYMD[1]) - 1;

    const taskInJuly2026 = (startY === 2026 && startM === 6) || (endY === 2026 && endM === 6) ||
                           (startY <= 2026 && startM <= 6 && endY >= 2026 && endM >= 6);

    if (!taskInJuly2026) return false;

    // Filtros de UI
    const matchesCompany = selectedCompanyId === 'all' || t.companyId === selectedCompanyId;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCompany && matchesType && matchesStatus && matchesPriority && matchesSearch;
  });

  // Agrupar tareas filtradas por empresa para renderizar una fila por cada una
  const activeCompanies = companies.filter((c) => {
    // Mostrar la empresa si tiene tareas que caen en este mes o si coincide con el filtro global de empresa
    const hasTasks = filteredTasks.some((t) => t.companyId === c.id);
    return selectedCompanyId === 'all' ? hasTasks : c.id === selectedCompanyId;
  });

  // Auxiliar para calcular grid-column de inicio y fin para la barra Gantt
  const getGridPlacement = (startDateStr: string, endDateStr: string) => {
    // Extraer días de Julio
    const startParts = startDateStr.split('-');
    const endParts = endDateStr.split('-');
    
    let startDay = 1;
    if (parseInt(startParts[0]) === 2026 && parseInt(startParts[1]) === 7) {
      startDay = parseInt(startParts[2]);
    }
    
    let endDay = daysInMonth;
    if (parseInt(endParts[0]) === 2026 && parseInt(endParts[1]) === 7) {
      endDay = parseInt(endParts[2]);
    }

    // Asegurar límites válidos entre 1 y 31
    startDay = Math.max(1, Math.min(daysInMonth, startDay));
    endDay = Math.max(1, Math.min(daysInMonth, endDay));

    if (endDay < startDay) endDay = startDay;

    const span = endDay - startDay + 1;
    return { start: startDay, span };
  };

  const isToday = (dayNum: number) => {
    return dayNum === 13; // Hoy es 13 de Julio de 2026 según el tiempo del sistema
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[70vh] overflow-hidden" id="timeline-view-container">
      {/* Explicación rápida */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Diagrama de Gantt Mensual</h3>
            <p className="text-xs text-slate-500">Cronograma de tareas cruzadas de Julio 2026. Desplázate horizontalmente si es necesario.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-sm" />
            <span>Julio de 2026</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-sm" />
            <span>Día de Hoy (13)</span>
          </div>
        </div>
      </div>

      {/* Gantt Workspace Grid Scrollable */}
      <div
        ref={timelineGridRef}
        className="flex-1 overflow-auto border border-slate-150 rounded-xl flex flex-col"
        style={{ minHeight: '350px' }}
      >
        {/* Tabla Gantt completa */}
        <div className="min-w-[1600px] flex-1 flex flex-col relative">
          {/* Header row: Días del Mes */}
          <div className="flex bg-slate-50 border-b border-slate-200 sticky top-0 z-20 h-10">
            {/* Esquina vacía para nombre de empresas */}
            <div className="w-[200px] bg-slate-50 border-r border-slate-200 flex items-center px-4 font-bold text-slate-400 text-[10px] uppercase tracking-wider sticky left-0 z-30">
              Empresa Cliente
            </div>

            {/* Cuadrícula de números de días */}
            <div className="flex-1 grid grid-cols-31 h-full">
              {daysArray.map((day) => {
                const dayIsToday = isToday(day);
                return (
                  <div
                    key={day}
                    className={`border-r border-slate-200/50 flex flex-col justify-center items-center text-xs font-bold ${
                      dayIsToday ? 'bg-yellow-100/70 text-yellow-800 border-r-yellow-300' : 'text-slate-600'
                    }`}
                    style={{ width: '45px' }}
                  >
                    <span>{day}</span>
                    <span className="text-[8px] font-medium text-slate-400">
                      {['D', 'L', 'M', 'M', 'J', 'V', 'S'][(new Date(2026, 6, day).getDay())]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body de Filas de Gantt */}
          <div className="flex-1 flex flex-col divide-y divide-slate-150 bg-slate-50/10">
            {activeCompanies.map((comp) => {
              const compTasks = filteredTasks.filter((t) => t.companyId === comp.id);

              return (
                <div key={comp.id} className="flex min-h-[85px] hover:bg-slate-50/40 relative">
                  {/* Celda izquierda: Empresa con color */}
                  <div className="w-[200px] border-r border-slate-200 flex flex-col justify-center px-4 bg-white sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: comp.color }} />
                      <span className="font-bold text-slate-800 text-xs truncate" title={comp.name}>
                        {comp.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {compTasks.length} {compTasks.length === 1 ? 'tarea' : 'tareas'}
                    </span>
                  </div>

                  {/* Celda derecha: Grid Gantt */}
                  <div className="flex-1 grid grid-cols-31 bg-white relative p-3 gap-y-2">
                    {/* Línea vertical para el día de hoy (13) */}
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none border-l-2 border-dashed border-yellow-400 bg-yellow-400/5 z-0"
                      style={{ left: `${(13 - 1) * 45 + 22.5}px` }}
                    />

                    {/* Render de barras Gantt apiladas */}
                    {compTasks.map((t) => {
                      const { start, span } = getGridPlacement(t.startDate, t.endDate);

                      return (
                        <div
                          key={t.id}
                          onClick={() => onSelectTask(t)}
                          className="col-span-full grid grid-cols-31 h-8 items-center cursor-pointer relative z-10"
                        >
                          <div
                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-95 transition-all truncate flex items-center justify-between border-l-3"
                            style={{
                              gridColumnStart: start,
                              gridColumnEnd: `span ${span}`,
                              backgroundColor: `${comp.color}dd`,
                              borderColor: comp.color,
                            }}
                            title={`${t.title} (${t.startDate} al ${t.endDate})`}
                          >
                            <span className="truncate flex-1 font-semibold">{t.title}</span>
                            <span className="text-[9px] font-mono opacity-90 font-bold ml-1">
                              {t.progress}%
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {compTasks.length === 0 && (
                      <div className="col-span-31 flex items-center justify-center text-xs text-slate-400 italic py-4">
                        Sin tareas planificadas este mes
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {activeCompanies.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16">
                <Calendar className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-sm font-semibold">No hay tareas o empresas con cronograma este mes</p>
                <p className="text-xs text-slate-400 mt-1">Intenta ajustando los filtros globales.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
