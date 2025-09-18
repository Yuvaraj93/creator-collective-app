export interface Note {
  id: string;
  content: string;
  type: 'note' | 'todo' | 'event';
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  content?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppEvent {
  id: string;
  title: string;
  content?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}