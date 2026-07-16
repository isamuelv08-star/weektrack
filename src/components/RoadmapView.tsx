import React, { useState } from 'react';
import { Task, Company, TaskType } from '../types';
import { TYPE_COLORS } from './TaskModal';
import { Layers, Calendar, ChevronRight, Filter, AlertCircle, Sparkles } from 'lucide-react';

interface RoadmapViewProps {
  tasks: Task[];
  companies: Company[];
  onSelectTask: (task: Task) => void;
  selectedCompanyId: string;
  searchQuery: string;
  selectedType: string;
  selectedStatus: string;
  selectedPriority: string;
}

const getWeeksOfCurrentMonth = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthShortName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month];
  const mStr = String(month + 1).padStart(2, '0');

  const weeks = [
    { id: 'w1', label: `Semana 1 (${monthShortName} 01 - ${monthShortName} 07)`, start: `${year}-${mStr}-01`, end: `${year}-${mStr}-07` },
    { id: 'w2', label: `Semana 2 (${monthShortName} 08 - ${monthShortName} 14)`, start: `${year}-${mStr}-08`, end: `${year}-${mStr}-14` },
    { id: 'w3', label: `Semana 3 (${monthShortName} 15 - ${monthShortName} 21)`, start: `${year}-${mStr}-15`, end: `${year}-${mStr}-21` },
    { id: 'w4', label: `Semana 4 (${monthShortName} 22 - ${monthShortName} 28)`, start: `${year}-${mStr}-22`, end: `${year}-${mStr}-28` },
  ];

  if (daysInMonth > 28) {
    weeks.push({
      id: 'w5',
      label: `Semana 5 (${monthShortName} 29 - ${monthShortName} ${String(daysInMonth).padStart(2, '0')})`,
      start: `${year}-${mStr}-29`,
      end: `${year}-${mStr}-${String(daysInMonth).padStart(2, '0')}`
    });
  }

  return weeks;
};

export default function RoadmapView({
  tasks,
  companies,
  onSelectTask,
  selectedCompanyId,
  searchQuery,
  selectedType,
  selectedStatus,
  selectedPriority,
}: RoadmapViewProps) {
  const weeks = getWeeksOfCurrentMonth();
  // Configuración de la agrupación del Roadmap: 'company' o 'type'
  const [groupBy, setGroupBy] = useState<'company' | 'type'>('company');

  // Filtrar tareas que correspondan a los filtros globales
  const filteredTasks = tasks.filter((t) => {
    const matchesCompany = selectedCompanyId === 'all' || t.companyId === selectedCompanyId;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCompany && matchesType && matchesStatus && matchesPriority && matchesSearch;
  });

  // Función para obtener las tareas que se entregan (endDate) dentro de una semana
  const getTasksForWeek = (startStr: string, endStr: string) => {
    return filteredTasks.filter((t) => {
      return t.endDate >= startStr && t.endDate <= endStr;
    });
  };

  return (
    <div className="space-y-6" id="roadmap-view-container">
      {/* Configuration Header Bar */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150/60">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Hoja de Ruta Semanal (Hitos y Entregables)</h3>
            <p className="text-xs text-slate-500">¿Qué hitos de Growth Scaling vencen esta semana?</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="text-xs font-semibold text-slate-500">Agrupar Entregas Por:</span>
          <div className="flex bg-slate-150 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setGroupBy('company')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                groupBy === 'company'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Cliente
            </button>
            <button
              onClick={() => setGroupBy('type')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                groupBy === 'type'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Tipo de Trabajo
            </button>
          </div>
        </div>
      </div>

      {/* Weeks Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {weeks.map((week) => {
          const weekTasks = getTasksForWeek(week.start, week.end);

          // Agrupar las tareas de esta semana según la configuración
          let groupedData: Record<string, Task[]> = {};
          if (groupBy === 'company') {
            groupedData = weekTasks.reduce((acc, t) => {
              const compName = companies.find((c) => c.id === t.companyId)?.name || 'Desconocido';
              acc[compName] = acc[compName] || [];
              acc[compName].push(t);
              return acc;
            }, {} as Record<string, Task[]>);
          } else {
            groupedData = weekTasks.reduce((acc, t) => {
              acc[t.type] = acc[t.type] || [];
              acc[t.type].push(t);
              return acc;
            }, {} as Record<string, Task[]>);
          }

          const groupKeys = Object.keys(groupedData);

          return (
            <div
              key={week.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col max-h-[68vh] overflow-hidden"
            >
              {/* Week Title */}
              <div className="pb-3 mb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{week.label.split(' ')[0]} {week.label.split(' ')[1]}</h4>
                  <span className="text-[10px] font-bold text-slate-400 block mt-0.5">{week.label.split('(')[1].replace(')', '')}</span>
                </div>
                <span className="bg-blue-50 text-blue-600 font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                  {weekTasks.length} {weekTasks.length === 1 ? 'entrega' : 'entregas'}
                </span>
              </div>

              {/* Grouped Contents */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {groupKeys.map((key) => {
                  const keyTasks = groupedData[key];
                  // Obtener color si agrupamos por empresa para la viñeta
                  const companyObj = companies.find((c) => c.name === key);
                  const colorAccent = companyObj ? companyObj.color : '#3b82f6';

                  return (
                    <div key={key} className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        {groupBy === 'company' && (
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorAccent }} />
                        )}
                        {key}
                      </span>

                      <div className="space-y-2">
                        {keyTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:border-slate-300 transition-all group/card flex flex-col gap-1.5"
                          >
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="font-bold text-slate-700 text-xs line-clamp-2 leading-tight group-hover/card:text-blue-600 transition-colors">
                                {t.title}
                              </h5>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover/card:text-blue-600 group-hover/card:translate-x-0.5 transition-all flex-shrink-0" />
                            </div>

                            <div className="flex items-center justify-between text-[9px] font-medium text-slate-400 mt-1">
                              <span className={`px-1.5 py-0.5 rounded-md border ${TYPE_COLORS[t.type]}`}>
                                {t.type}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                t.status === 'Completado'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : t.status === 'Bloqueado'
                                  ? 'bg-rose-50 text-rose-600 animate-pulse'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {t.status}
                              </span>
                            </div>

                            {/* Mini progreso */}
                            {t.checklist && t.checklist.length > 0 && (
                              <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all"
                                  style={{ width: `${t.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {weekTasks.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs italic flex flex-col items-center justify-center gap-1.5">
                    <Sparkles className="w-8 h-8 text-slate-200" />
                    Sin entregables programados para esta semana
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
