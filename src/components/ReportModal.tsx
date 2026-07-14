import React, { useState } from 'react';
import { Task, Company } from '../types';
import { X, Printer, Copy, CheckCircle, Clock, Percent, FileText, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  companies: Company[];
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ReportModal({ isOpen, onClose, tasks, companies }: ReportModalProps) {
  // Inicializar en Julio de 2026 (por la fecha actual)
  const [selectedMonth, setSelectedMonth] = useState(6); // 0-indexed, 6 = Julio
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filtrar tareas por el mes, año y empresa seleccionados
  const filteredTasks = tasks.filter((t) => {
    const taskDate = new Date(t.startDate + 'T00:00:00');
    const taskMonth = taskDate.getMonth();
    const taskYear = taskDate.getFullYear();

    const matchesMonth = taskMonth === selectedMonth;
    const matchesYear = taskYear === selectedYear;
    const matchesCompany = selectedCompanyId === 'all' || t.companyId === selectedCompanyId;

    return matchesMonth && matchesYear && matchesCompany;
  });

  // Cálculos estadísticos
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'Completado');
  const completedCount = completedTasks.length;
  const pendingTasks = filteredTasks.filter((t) => t.status !== 'Completado' && t.status !== 'Bloqueado');
  const blockedTasks = filteredTasks.filter((t) => t.status === 'Bloqueado');
  
  // Calcular % de cumplimiento
  const complianceRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Desglose por tipo de tarea
  const typeStats = filteredTasks.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Nombre de la empresa seleccionada
  const companyName = selectedCompanyId === 'all' 
    ? 'Todas las Empresas' 
    : companies.find((c) => c.id === selectedCompanyId)?.name || 'Cliente';

  // Generar texto plano Markdown para copiar
  const generateMarkdownReport = () => {
    let reportText = `📊 *INFORME DE RENDIMIENTO MENSUAL - ${companyName.toUpperCase()}*\n`;
    reportText += `📅 *Periodo:* ${MONTHS[selectedMonth]} ${selectedYear}\n`;
    reportText += `📈 *Metodología:* Growth Scaling / iGenius Solutions\n`;
    reportText += `----------------------------------------------\n\n`;
    
    reportText += `*MÉTRICAS CLAVE:*\n`;
    reportText += `• Tareas Planificadas: ${totalTasks}\n`;
    reportText += `• Tareas Completadas: ${completedCount}\n`;
    reportText += `• Cumplimiento General: ${complianceRate}%\n`;
    reportText += `• Tareas Pendientes/En Curso: ${pendingTasks.length}\n`;
    reportText += `• Tareas Bloqueadas: ${blockedTasks.length}\n\n`;

    reportText += `*DESGLOSE POR ENTREGABLE:*\n`;
    Object.entries(typeStats).forEach(([type, count]) => {
      reportText += `• ${type}: ${count}\n`;
    });
    reportText += `\n`;

    reportText += `*HITOS COMPLETADOS DETALLADOS:*\n`;
    if (completedTasks.length === 0) {
      reportText += `Ninguna tarea completada en este periodo aún.\n`;
    } else {
      completedTasks.forEach((t, i) => {
        const comp = companies.find(c => c.id === t.companyId)?.name || 'Cliente';
        reportText += `${i + 1}. [${comp}] *${t.title}*\n`;
        if (t.checklist && t.checklist.length > 0) {
          t.checklist.forEach((sub) => {
            reportText += `   ${sub.completed ? '✓' : '✗'} ${sub.text}\n`;
          });
        }
        reportText += `\n`;
      });
    }

    reportText += `----------------------------------------------\n`;
    reportText += `_Generado automáticamente desde Cronograma Pro - iGenius Solutions_`;
    return reportText;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8"
          id="report-modal-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 print:hidden">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Generar Reporte Mensual de Rendimiento</h3>
                <p className="text-xs text-slate-500">Cierre de mes automático y exportación directa para clientes</p>
              </div>
            </div>
            <button
              id="close-report-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selectors Bar */}
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between print:hidden">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Empresa Cliente</label>
                <select
                  id="report-company-select"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                >
                  <option value="all">Todas las Empresas</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mes del Cierre</label>
                <select
                  id="report-month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Año</label>
                <select
                  id="report-year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                id="copy-report-markdown-btn"
                onClick={handleCopyText}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Reporte
                  </>
                )}
              </button>
              <button
                id="print-report-btn"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir / PDF
              </button>
            </div>
          </div>

          {/* Document Workspace Area */}
          <div className="p-8 flex-1 overflow-y-auto max-h-[50vh] bg-slate-100/30 print:bg-white print:max-h-none print:overflow-visible">
            {/* Document Content */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-8 max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0">
              {/* Header Document */}
              <div className="flex items-start justify-between border-b pb-6 mb-6">
                <div>
                  <span className="text-xs font-bold text-blue-600 tracking-widest uppercase">Reporte Mensual de Avance</span>
                  <h1 className="text-2xl font-bold text-slate-800 mt-1">{companyName}</h1>
                  <p className="text-sm text-slate-500">Metodología de Trabajo: Growth Scaling</p>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-semibold text-slate-700">iGenius Solutions</h2>
                  <p className="text-xs text-slate-400">Consultoría de Marketing</p>
                  <p className="text-xs text-slate-400 mt-1">{MONTHS[selectedMonth]} {selectedYear}</p>
                </div>
              </div>

              {totalTasks === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium">No se encontraron tareas registradas para este periodo y cliente.</p>
                  <p className="text-xs text-slate-400 mt-1">Verifica la fecha de inicio de las tareas en la pantalla principal.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* KPIs grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Planificadas</span>
                        <FileText className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-2xl font-extrabold text-slate-800 mt-2">{totalTasks}</span>
                    </div>

                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Completadas</span>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-2xl font-extrabold text-emerald-700 mt-2">{completedCount}</span>
                    </div>

                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-orange-600 uppercase">En Proceso</span>
                        <Clock className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-2xl font-extrabold text-orange-700 mt-2">{pendingTasks.length}</span>
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">Cumplimiento</span>
                        <Percent className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-2xl font-extrabold text-blue-700 mt-2">{complianceRate}%</span>
                    </div>
                  </div>

                  {/* Types breakdown */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                      Desglose de Trabajo por Categoría
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(typeStats).map(([type, count]) => (
                        <div key={type} className="px-3 py-1 bg-slate-50 border border-slate-150 rounded-full text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          {type}: <strong className="text-slate-800">{count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Completed Tasks List */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 border-b pb-1.5">
                      Entregables Completados con Éxito ({completedCount})
                    </h3>
                    {completedTasks.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No hay tareas marcadas como Completadas todavía.</p>
                    ) : (
                      <div className="space-y-4">
                        {completedTasks.map((t) => (
                          <div key={t.id} className="p-4 border border-slate-100 bg-slate-50/30 rounded-xl">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-slate-800 text-sm">{t.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                              </div>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                                {t.type}
                              </span>
                            </div>

                            {t.checklist && t.checklist.length > 0 && (
                              <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-1.5">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Checklist de Verificación</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {t.checklist.map((sub) => (
                                    <div key={sub.id} className="flex items-center gap-2 text-xs text-slate-600">
                                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${sub.completed ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        ✓
                                      </span>
                                      <span className={sub.completed ? 'text-slate-500' : 'text-slate-400'}>{sub.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending/Locked Tasks Section */}
                  {(pendingTasks.length > 0 || blockedTasks.length > 0) && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 border-b pb-1.5">
                        Tareas Pendientes o en Seguimiento ({pendingTasks.length + blockedTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {[...pendingTasks, ...blockedTasks].map((t) => (
                          <div key={t.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${t.status === 'Bloqueado' ? 'bg-red-500 animate-pulse' : 'bg-orange-400'}`} />
                              <span className="font-semibold text-slate-700">{t.title}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">
                                {t.type}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${t.status === 'Bloqueado' ? 'bg-red-100 text-red-800' : 'bg-orange-100'}`}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signatures */}
                  <div className="pt-12 mt-12 border-t flex justify-between items-center text-xs text-slate-400">
                    <div>
                      <p className="font-semibold text-slate-600">Firma del Consultor Growth</p>
                      <p className="mt-1">iGenius Solutions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-600">Aprobación del Cliente</p>
                      <p className="mt-1">{companyName}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
