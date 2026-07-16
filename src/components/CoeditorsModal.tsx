import React, { useState } from 'react';
import { X, Shield, Users, Lock, Share2, Check, Radio, UserCheck, ShieldCheck, UserX, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Company, AccessRequest } from '../types';
import { useFeedback } from './FeedbackProvider';

interface CoeditorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUserRole: string;
  activeUserName: string;
  companies: Company[];
  selectedCompanyId: string;
  accessRequests: AccessRequest[];
  onApproveRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
}

export default function CoeditorsModal({
  isOpen,
  onClose,
  activeUserRole,
  activeUserName,
  companies,
  selectedCompanyId,
  accessRequests,
  onApproveRequest,
  onRejectRequest,
}: CoeditorsModalProps) {
  const { showToast } = useFeedback();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedCompanyForLink, setSelectedCompanyForLink] = useState<string>(selectedCompanyId === 'all' ? (companies[0]?.id || '') : selectedCompanyId);

  if (!isOpen) return null;

  const generateSharingLink = (role: 'Admin' | 'Equipo' | 'Cliente', companyId?: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    let name = 'Sofía Pasquel';
    if (role === 'Equipo') name = 'Carlos Gómez';
    if (role === 'Admin') name = 'Samuel V.';
    
    let url = `${baseUrl}?role=${role.toLowerCase()}&name=${encodeURIComponent(name)}`;
    if (role !== 'Admin' && companyId && companyId !== 'all') {
      url += `&company=${companyId}`;
    }
    return url;
  };

  const copyToClipboard = (key: string, text: string, roleName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`¡Enlace de ${roleName} copiado al portapapeles!`, 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative border border-slate-100 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/20">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white leading-tight">Gestionar Coeditores e Invitaciones</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Control de accesos y links dinámicos para el equipo y clientes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Context/My Access Banner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="text-slate-600 font-medium">
                  Rol activo actual: <strong className="text-slate-800 font-black uppercase">{activeUserRole}</strong>
                </span>
              </div>
              <span className="text-slate-400 font-medium text-[11px]">{activeUserName}</span>
            </div>

            {/* Section 1: Generate Sharing Links */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5" /> Enlaces de Invitación
                </h4>
                
                {/* Company Filter Selector for team/client links */}
                {companies.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                    <span className="text-[10px] font-bold text-slate-500">Filtrar por Cliente:</span>
                    <select
                      value={selectedCompanyForLink}
                      onChange={(e) => setSelectedCompanyForLink(e.target.value)}
                      className="bg-transparent text-[10px] font-extrabold text-slate-700 outline-none cursor-pointer"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                
                {/* 1. Admin Link (Only visible/applicable for Admin mode) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-100 hover:bg-blue-50/5 transition-all">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-xs text-slate-800">Enlace de Administrador</h5>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5 font-medium">
                        Otorga control absoluto: planificar, editar clientes, y gestionar todos los entregables.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const link = generateSharingLink('Admin');
                      copyToClipboard('Admin', link, 'Administrador');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      copiedKey === 'Admin'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {copiedKey === 'Admin' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'Admin' ? '¡Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>

                {/* 2. Team Link */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-100 hover:bg-indigo-50/5 transition-all">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-xs text-slate-800">
                        Enlace de Equipo Técnico {selectedCompanyForLink && `(${companies.find(c => c.id === selectedCompanyForLink)?.name || ''})`}
                      </h5>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5 font-medium">
                        Habilita la edición de tareas, checklist y comentarios para el equipo en el cliente seleccionado.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const link = generateSharingLink('Equipo', selectedCompanyForLink);
                      copyToClipboard('Equipo', link, 'Equipo Técnico');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      copiedKey === 'Equipo'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {copiedKey === 'Equipo' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'Equipo' ? '¡Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>

                {/* 3. Client Link */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-100 hover:bg-emerald-50/5 transition-all">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-xs text-slate-800">
                        Enlace de Cliente {selectedCompanyForLink && `(${companies.find(c => c.id === selectedCompanyForLink)?.name || ''})`}
                      </h5>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5 font-medium">
                        Permite acceso de solo lectura e interacción con comentarios para el cliente correspondiente.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const link = generateSharingLink('Cliente', selectedCompanyForLink);
                      copyToClipboard('Cliente', link, 'Cliente');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      copiedKey === 'Cliente'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {copiedKey === 'Cliente' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'Cliente' ? '¡Copiado!' : 'Copiar Link'}</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Section 2: Manage Access Requests (Only for Admin) */}
            {activeUserRole === 'Admin' && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> Solicitudes de Co-Editor
                </h4>

                {accessRequests.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-medium">
                    No hay solicitudes registradas en este navegador aún.
                  </div>
                ) : (
                  <div className="border border-slate-150 rounded-2xl divide-y divide-slate-150 overflow-hidden bg-slate-50/50">
                    {accessRequests.map((req) => (
                      <div key={req.id} className="p-3.5 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/30 transition-all">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 text-xs">{req.name}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                              {req.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            Solicitado el {new Date(req.timestamp).toLocaleDateString()} a las {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {req.status === 'pending' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onApproveRequest(req.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-[10px] cursor-pointer transition-all flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3" /> Aprobar
                              </button>
                              <button
                                onClick={() => onRejectRequest(req.id)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-[10px] cursor-pointer transition-all flex items-center gap-1"
                              >
                                <UserX className="w-3 h-3" /> Rechazar
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                              req.status === 'approved' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {req.status === 'approved' ? 'Autorizado' : 'Rechazado'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer close button */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300/85 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-all"
            >
              Cerrar Panel
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
