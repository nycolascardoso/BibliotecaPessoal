import React, { useState } from 'react';
import { Book, BookStatus, BookFormat, Owner } from '../types';
import { enrichBookData } from '../services/geminiService';
import { Wand2, Loader2, Save } from 'lucide-react';

interface BookFormProps {
  onSave: (book: Book) => void;
  onCancel: () => void;
  initialData?: Book;
  isWishlistMode?: boolean;
}

export const BookForm: React.FC<BookFormProps> = ({ onSave, onCancel, initialData, isWishlistMode = false }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Default State
  const [formData, setFormData] = useState<Partial<Book>>(initialData || {
    title: '',
    author: '',
    genre: [],
    tags: [],
    status: BookStatus.UNREAD,
    format: BookFormat.PHYSICAL,
    owner: Owner.ME,
    totalPages: 0,
    currentPage: 0,
    isWishlist: isWishlistMode,
    location: '',
    description: ''
  });

  const [rawGenres, setRawGenres] = useState(initialData?.genre.join(', ') || '');
  const [rawTags, setRawTags] = useState(initialData?.tags.join(', ') || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMagicFill = async () => {
    if (!formData.title) return;
    setLoadingAI(true);
    
    // Construct a query combining title and author if available
    const query = `${formData.title} ${formData.author ? `by ${formData.author}` : ''}`;
    
    const enriched = await enrichBookData(query);
    
    if (enriched) {
      setFormData(prev => ({
        ...prev,
        ...enriched,
        // Preserve user-specific fields if they were already set, unless empty
        status: prev.status,
        owner: prev.owner,
        location: prev.location
      }));
      setRawGenres(enriched.genre?.join(', ') || '');
      setRawTags(enriched.tags?.join(', ') || '');
    }
    
    setLoadingAI(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBook: Book = {
      id: initialData?.id || crypto.randomUUID(),
      addedAt: initialData?.addedAt || Date.now(),
      ...formData as Book,
      genre: rawGenres.split(',').map(s => s.trim()).filter(Boolean),
      tags: rawTags.split(',').map(s => s.trim()).filter(Boolean),
      totalPages: Number(formData.totalPages),
      currentPage: Number(formData.currentPage)
    };
    onSave(finalBook);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-brand-200 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-800">
          {initialData ? 'Editar Livro' : (isWishlistMode ? 'Adicionar à Lista de Desejos' : 'Adicionar Novo Livro')}
        </h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">Cancelar</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Title & AI Button */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
              placeholder="Ex: O Senhor dos Anéis"
            />
          </div>
          <button
            type="button"
            onClick={handleMagicFill}
            disabled={!formData.title || loadingAI}
            className={`px-4 py-2 rounded-md flex items-center gap-2 text-white font-medium transition ${
              !formData.title ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
            }`}
          >
            {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loadingAI ? 'Pensando...' : 'Preencher com IA'}
          </button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dono</label>
            <select
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-brand-500"
            >
              {Object.values(Owner).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gêneros (sep. por vírgula)</label>
            <input
              type="text"
              value={rawGenres}
              onChange={(e) => setRawGenres(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Fantasia, Aventura"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (sep. por vírgula)</label>
            <input
              type="text"
              value={rawTags}
              onChange={(e) => setRawTags(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Clássico, Épico, Magia"
            />
          </div>
        </div>

        {/* Status & Format */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-brand-500"
            >
              {Object.values(BookStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
            <select
              name="format"
              value={formData.format}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-brand-500"
            >
              {Object.values(BookFormat).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
             <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Estante sala / Kindle"
              className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Progress */}
        <div className="grid grid-cols-2 gap-4 bg-brand-50 p-4 rounded-md">
           <div>
            <label className="block text-sm font-medium text-brand-800 mb-1">Página Atual</label>
             <input
              type="number"
              name="currentPage"
              min="0"
              value={formData.currentPage}
              onChange={handleChange}
              className="w-full p-2 border border-brand-200 rounded-md outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-800 mb-1">Total Páginas</label>
             <input
              type="number"
              name="totalPages"
              min="0"
              value={formData.totalPages}
              onChange={handleChange}
              className="w-full p-2 border border-brand-200 rounded-md outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resumo (opcional)</label>
            <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-brand-500"
            ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-brand-600 text-white font-bold py-3 rounded-md hover:bg-brand-700 transition flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Salvar Livro
        </button>
      </form>
    </div>
  );
};