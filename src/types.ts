export type TaskStatus = 'Por hacer' | 'En proceso' | 'En revisión' | 'Completado' | 'Bloqueado';
export type TaskPriority = 'Alta' | 'Media' | 'Baja';
export type TaskType = 'Contenido' | 'Pauta' | 'CRM' | 'Reunión' | 'Entrega' | 'Administrativo' | 'Otro';

export interface Company {
  id: string;
  name: string;
  color: string; // Hex color code or Tailwind color base name
  status: 'activa' | 'archivada';
  notes?: string;
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  authorName: string;
  authorRole: 'Admin' | 'Equipo' | 'Cliente';
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description: string;
  type: TaskType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: TaskStatus;
  priority: TaskPriority;
  checklist: SubTask[];
  progress: number; // 0 to 100
  comments?: Comment[];
}

export interface AccessRequest {
  id: string;
  role: 'Admin' | 'Equipo' | 'Cliente';
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

