import React, { useState } from 'react';
import { Company } from '../types';
import { X, Plus, Trash2, Edit2, Check, Archive } from 'lucide-react';
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

  const [isCreating, setIsCreating] = useState(false);

  const resetForm = () => {
    setName('');
    setColor(COLORS_PRESET[0]);
    setNotes('');
    setStatus('activa');
    setEditingId(null);
    setIsCreating(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const existing = companies.find((c) => c.id === editingId);
      if (existing) {
        onUpdateCompany({
          ...existing,
          name: name.trim(),
          color,
          notes: notes.trim(),
          status,
        });
      }
    } else {
      onAddCompany({
        name: name.trim(),
        color,
        notes: notes.trim(),
        status,
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
    setIsCreating(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          id="company-modal-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Gestionar Empresas Clientes</h3>
              <p className="text-xs text-slate-500">Añade o edita los clientes de iGenius Solutions</p>
            </div>
            <button
              id="close-company-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Formulario Crear/Editar */}
            {isCreating ? (
              <form onSubmit={handleSave} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h4 className="text-sm font-medium text-slate-700">
                  {editingId ? 'Editar Empresa Cliente' : 'Añadir Nueva Empresa Cliente'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre Comercial *</label>
                    <input
                      id="company-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Mundillantas"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Estado de Cuenta</label>
                    <select
                      id="company-status-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'activa' | 'archivada')}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="activa">Activa / En Ejecución</option>
                      <option value="archivada">Archivada / En Pausa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Color Identificador</label>
                  <div className="flex flex-wrap gap-2 py-1">
                    {COLORS_PRESET.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className="w-8 h-8 rounded-full border border-black/10 transition-transform relative flex items-center justify-center hover:scale-105 cursor-pointer"
                        style={{ backgroundColor: c }}
                      >
                        {color === c && (
                          <Check className="w-4 h-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Notas / Notas de Estrategia</label>
                  <textarea
                    id="company-notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Estrategia Growth enfocada en captación B2B..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="save-company-btn"
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {editingId ? 'Guardar Cambios' : 'Registrar Cliente'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                id="toggle-add-company-form-btn"
                onClick={() => setIsCreating(true)}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/20 transition-all text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar Nueva Empresa Cliente
              </button>
            )}

            {/* Listado de empresas */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Clientes Registrados ({companies.length})
              </h4>
              <div className="space-y-2">
                {companies.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl hover:border-slate-200 shadow-xs transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <div>
                        <span className="font-medium text-slate-700 text-sm flex items-center gap-2">
                          {c.name}
                          {c.status === 'archivada' && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-normal flex items-center gap-0.5">
                              <Archive className="w-2.5 h-2.5" /> Archivado
                            </span>
                          )}
                        </span>
                        {c.notes && <p className="text-xs text-slate-400 line-clamp-1">{c.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(c)}
                        title="Editar cliente"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que quieres eliminar a ${c.name}? Esto desvinculará sus tareas.`)) {
                            onDeleteCompany(c.id);
                          }
                        }}
                        title="Eliminar cliente"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {companies.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    No hay empresas registradas. Crea una para comenzar.
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
