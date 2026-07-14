import React, { useState } from 'react';
import { Company } from '../types';
import { X, Plus, Trash2, Edit2, Check, Archive, Share2, Shield, Eye, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  onAddCompany: (company: Omit<Company, 'id'>) => void;
  onUpdateCompany: (company: Company) => void;
  onDeleteCompany: (id: string) => void;
}

const COLORS_PRESET = [
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#ec4899', // Pink
  '#eab308', // Yellow
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#64748b', // Slate
];

const AVAILABLE_VIEWS = [
  { id: 'calendario', label: 'Calendario' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'timeline', label: 'Timeline / Gantt' },
  { id: 'colaboracion', label: 'Colaboración & Chat' },
];

export default function CompanyModal({
  isOpen,
  onClose,
  companies,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
}: CompanyModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS_PRESET[0]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'activa' | 'archivada'>('activa');

  // Nuevos Campos de Seguridad y Enlaces Únicos
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamEmail, setTeamEmail] = useState('');
  
  const [allowedViewsCliente, setAllowedViewsCliente] = useState<string[]>(['calendario', 'kanban', 'colaboracion']);
  const [allowedViewsEquipo, setAllowedViewsEquipo] = useState<string[]>(['calendario', 'kanban', 'roadmap', 'timeline', 'colaboracion']);

  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedLinksId, setExpandedLinksId] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setColor(COLORS_PRESET[0]);
    setNotes('');
    setStatus('activa');
    setManagerName('');
    setManagerEmail('');
    setTeamName('');
    setTeamEmail('');
    setAllowedViewsCliente(['calendario', 'kanban', 'colaboracion']);
    setAllowedViewsEquipo(['calendario', 'kanban', 'roadmap', 'timeline', 'colaboracion']);
    setEditingId(null);
    setIsCreating(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const accessData = {
      managerName: managerName.trim() || 'Gerente',
      managerEmail: managerEmail.trim().toLowerCase() || 'gerente@' + name.trim().toLowerCase().replace(/\s+/g, '') + '.com',
      teamName: teamName.trim() || 'Equipo Técnico',
      teamEmail: teamEmail.trim().toLowerCase() || 'equipo@' + name.trim().toLowerCase().replace(/\s+/g, '') + '.com',
      allowedViewsCliente,
      allowedViewsEquipo,
    };

    if (editingId) {
      const existing = companies.find((c) => c.id === editingId);
      if (existing) {
        onUpdateCompany({
          ...existing,
          name: name.trim(),
          color,
          notes: notes.trim(),
          status,
          ...accessData,
        });
      }
    } else {
      onAddCompany({
        name: name.trim(),
        color,
        notes: notes.trim(),
        status,
        ...accessData,
      });
    }
    resetForm();
  };

  const startEdit = (c: Company) => {
    setEditingId(c.id);
    setName(c.name);
    setColor(c.color);
    setNotes(c.notes || '');
    setStatus(c.status);
    setManagerName(c.managerName || '');
    setManagerEmail(c.managerEmail || '');
    setTeamName(c.teamName || '');
    setTeamEmail(c.teamEmail || '');
    setAllowedViewsCliente(c.allowedViewsCliente || ['calendario', 'kanban', 'colaboracion']);
    setAllowedViewsEquipo(c.allowedViewsEquipo || ['calendario', 'kanban', 'roadmap', 'timeline', 'colaboracion']);
    setIsCreating(true);
  };

  const toggleClienteView = (viewId: string) => {
    setAllowedViewsCliente((prev) =>
      prev.includes(viewId) ? prev.filter((v) => v !== viewId) : [...prev, viewId]
    );
  };

  const toggleEquipoView = (viewId: string) => {
    setAllowedViewsEquipo((prev) =>
      prev.includes(viewId) ? prev.filter((v) => v !== viewId) : [...prev, viewId]
    );
  };

  const getSharingLink = (companyId: string, role: 'Cliente' | 'Equipo') => {
    const customDomain = localStorage.getItem('wt_custom_share_domain');
    const baseUrl = customDomain ? customDomain.replace(/\/$/, '') : (window.location.origin + window.location.pathname);
    return `${baseUrl}?company=${companyId}&role=${role.toLowerCase()}`;
  };

  const copyToClipboard = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          id="company-modal-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Gestionar Empresas y Accesos</h3>
              <p className="text-xs text-slate-500">Configura perfiles, asigna correos autorizados y genera enlaces de acceso únicos</p>
            </div>
            <button
              id="close-company-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Formulario Crear/Editar */}
            {isCreating ? (
              <form onSubmit={handleSave} className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" />
                  {editingId ? 'Editar Empresa y Permisos' : 'Añadir Nueva Empresa y Permisos'}
                </h4>
                
                {/* 1. Datos Generales de la Empresa */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-150">
                  <h5 className="text-xs font-bold text-slate-800">1. Información Comercial</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Comercial *</label>
                      <input
                        id="company-name-input"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Mundillantas"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estado de Cuenta</label>
                      <select
                        id="company-status-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'activa' | 'archivada')}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="activa">Activa / En Ejecución</option>
                        <option value="archivada">Archivada / En Pausa</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notas Estratégicas</label>
                    <textarea
                      id="company-notes-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notas, metas, o prioridades clave para este cliente..."
                      rows={2}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Color de Marca</label>
                    <div className="flex flex-wrap gap-2 py-1">
                      {COLORS_PRESET.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setColor(c)}
                          className="w-7 h-7 rounded-full border border-black/10 transition-transform relative flex items-center justify-center hover:scale-105 cursor-pointer"
                          style={{ backgroundColor: c }}
                        >
                          {color === c && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Configuración Gerente Cliente */}
                <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h5 className="text-xs font-bold text-slate-800">2. Credenciales del Gerente Cliente (Rol: Cliente)</h5>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full uppercase border border-emerald-100">
                      Gerente
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo del Gerente</label>
                      <input
                        type="text"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="Ej: Sofía Pasquel"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico Autorizado</label>
                      <input
                        type="email"
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        placeholder="Ej: sofia@mundillantas.com"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Vistas Permitidas en su Panel</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AVAILABLE_VIEWS.map((v) => {
                        const active = allowedViewsCliente.includes(v.id);
                        return (
                          <button
                            type="button"
                            key={v.id}
                            onClick={() => toggleClienteView(v.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-[11px] font-bold transition-all cursor-pointer ${
                              active 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-white ${
                              active ? 'bg-emerald-600 border-emerald-500' : 'bg-white border-slate-300'
                            }`}>
                              {active && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                            </span>
                            {v.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Configuración Equipo Técnico */}
                <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h5 className="text-xs font-bold text-slate-800">3. Credenciales del Equipo de Trabajo (Rol: Equipo)</h5>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase border border-indigo-100">
                      Equipo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre del Equipo / Líder Técnico</label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Ej: Carlos Gómez (Diseño)"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico Autorizado</label>
                      <input
                        type="email"
                        value={teamEmail}
                        onChange={(e) => setTeamEmail(e.target.value)}
                        placeholder="Ej: carlos@igenius.com"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Vistas Permitidas en su Panel</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AVAILABLE_VIEWS.map((v) => {
                        const active = allowedViewsEquipo.includes(v.id);
                        return (
                          <button
                            type="button"
                            key={v.id}
                            onClick={() => toggleEquipoView(v.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-[11px] font-bold transition-all cursor-pointer ${
                              active 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-2xs' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-white ${
                              active ? 'bg-indigo-600 border-indigo-500' : 'bg-white border-slate-300'
                            }`}>
                              {active && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                            </span>
                            {v.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-250 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="save-company-btn"
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingId ? 'Guardar Cambios' : 'Registrar Empresa Cliente'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                id="toggle-add-company-form-btn"
                onClick={() => {
                  resetForm();
                  setIsCreating(true);
                }}
                className="w-full py-3 border-2 border-dashed border-slate-250 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/15 transition-all text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Crear Nuevo Perfil de Negocio
              </button>
            )}

            {/* Listado de empresas */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Perfiles de Clientes Activos ({companies.length})
              </h4>
              <div className="space-y-3">
                {companies.map((c) => {
                  const isExpanded = expandedLinksId === c.id;
                  const shareManagerLink = getSharingLink(c.id, 'Cliente');
                  const shareTeamLink = getSharingLink(c.id, 'Equipo');

                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:shadow-xs transition-all flex flex-col"
                    >
                      {/* Main row */}
                      <div className="flex items-center justify-between p-4 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                          <div>
                            <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                              {c.name}
                              {c.status === 'archivada' && (
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 border border-slate-200">
                                  Archivado
                                </span>
                              )}
                            </span>
                            {c.notes && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{c.notes}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Ver Enlaces de Compartir */}
                          <button
                            onClick={() => setExpandedLinksId(isExpanded ? null : c.id)}
                            className={`px-2.5 py-1.5 rounded-xl border transition-all text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                              isExpanded 
                                ? 'bg-slate-100 text-slate-800 border-slate-300' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Share2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Enlaces Únicos</span>
                          </button>

                          <button
                            onClick={() => startEdit(c)}
                            title="Editar cliente"
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de que deseas eliminar a ${c.name}? Esto desvinculará permanentemente todas sus tareas y registros.`)) {
                                onDeleteCompany(c.id);
                              }
                            }}
                            title="Eliminar cliente"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Sharing Links Row */}
                      {isExpanded && (
                        <div className="bg-slate-50 border-t border-slate-150 p-4 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Settings className="w-3.5 h-3.5 text-blue-600" />
                              Enlaces y Permisos de Acceso Únicos
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Restringido a correos registrados</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Manager/Client Box */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-slate-800">{c.managerName || 'Gerente'}</span>
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                                    Gerente
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold">Correo: <strong className="text-slate-600">{c.managerEmail || 'No asignado'}</strong></p>
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {(c.allowedViewsCliente || ['calendario', 'kanban', 'colaboracion']).map(vId => (
                                    <span key={vId} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-extrabold capitalize">
                                      {vId}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(shareManagerLink, `${c.id}_manager`)}
                                className="w-full mt-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {copiedId === `${c.id}_manager` ? '¡Enlace Copiado!' : 'Copiar Enlace Gerente'}
                              </button>
                            </div>

                            {/* Team Box */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-slate-800">{c.teamName || 'Equipo Técnico'}</span>
                                  <span className="text-[9px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                                    Equipo
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold">Correo: <strong className="text-slate-600">{c.teamEmail || 'No asignado'}</strong></p>
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {(c.allowedViewsEquipo || ['calendario', 'kanban', 'roadmap', 'timeline', 'colaboracion']).map(vId => (
                                    <span key={vId} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-extrabold capitalize">
                                      {vId}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(shareTeamLink, `${c.id}_team`)}
                                className="w-full mt-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {copiedId === `${c.id}_team` ? '¡Enlace Copiado!' : 'Copiar Enlace Equipo'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {companies.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No hay empresas creadas. Registra una para comenzar.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
