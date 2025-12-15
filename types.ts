export enum BookStatus {
  UNREAD = 'Não Lido',
  READING = 'Lendo',
  COMPLETED = 'Lido',
  ABANDONED = 'Abandonado'
}

export enum BookFormat {
  PHYSICAL = 'Físico',
  DIGITAL = 'Digital (Kindle/PDF)',
  AUDIOBOOK = 'Audiobook'
}

export enum Owner {
  ME = 'Eu',
  SPOUSE = 'Esposa',
  SHARED = 'Compartilhado'
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string; // URL for cover image
  genre: string[];
  tags: string[];
  description?: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  format: BookFormat;
  owner: Owner;
  location?: string; // Physical shelf location or file path
  isWishlist: boolean;
  rating?: number; // 0-5
  addedAt: number;
}

export type ViewState = 'dashboard' | 'library' | 'wishlist' | 'add';
