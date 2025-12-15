import React, { useState, useEffect, useRef } from 'react';
import { Book, ViewState, BookStatus, BookFormat, Owner } from './types';
import { BookForm } from './components/BookForm';
import { LibraryStats } from './components/StatsComponents';
import { getRecommendations, parseWishlistImage } from './services/geminiService';
import { legacyLibrary } from './data/legacyLibrary';
import { 
  Book as BookIcon, 
  Library, 
  LayoutDashboard, 
  Heart, 
  Plus, 
  Search,
  MoreVertical,
  BookOpen,
  Sparkles,
  MapPin,
  User,
  Upload,
  Loader2,
  Database
} from 'lucide-react';

const App = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [view, setView] = useState<ViewState>('dashboard');
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('biblio-gestor-data');
    if (saved) {
      setBooks(JSON.parse(saved));
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('biblio-gestor-data', JSON.stringify(books));
  }, [books]);

  const handleSaveBook = (book: Book) => {
    if (editingBook) {
      setBooks(books.map(b => b.id === book.id ? book : b));
    } else {
      setBooks([...books, book]);
    }
    setView('library');
    setEditingBook(undefined);
  };

  const handleDeleteBook = (id: string) => {
    if(window.confirm("Tem certeza que deseja remover este livro?")) {
        setBooks(books.filter(b => b.id !== id));
    }
  };

  const handleLoadLegacyData = () => {
      if(window.confirm("Isso adicionará os livros da planilha demo à sua biblioteca atual. Continuar?")) {
          // Merge to avoid duplicates by title
          const currentTitles = new Set(books.map(b => b.title.toLowerCase()));
          const newBooks = legacyLibrary.filter(b => !currentTitles.has(b.title.toLowerCase()));
          
          if (newBooks.length === 0) {
              alert("Todos os livros da planilha já estão na sua biblioteca.");
              return;
          }

          setBooks([...books, ...newBooks]);
          alert(`${newBooks.length} livros importados com sucesso!`);
          setView('library');
      }
  };

  const generateRecs = async () => {
    setLoadingRecs(true);
    const recs = await getRecommendations(books);
    setRecommendations(recs);
    setLoadingRecs(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Extract base64, remove prefix (data:image/png;base64,)
        const base64String = reader.result?.toString().split(',')[1];
        if (base64String) {
          const extractedBooks = await parseWishlistImage(base64String, file.type);
          if (extractedBooks && extractedBooks.length > 0) {
             const newBooks: Book[] = extractedBooks.map(b => ({
                id: crypto.randomUUID(),
                title: b.title,
                author: 'TBD', 
                genre: [],
                tags: ['Importado via IA'],
                status: BookStatus.UNREAD,
                format: BookFormat.PHYSICAL,
                owner: Owner.ME,
                totalPages: 0,
                currentPage: 0,
                isWishlist: true,
                addedAt: Date.now()
             }));
             setBooks(prev => [...prev, ...newBooks]);
             alert(`${newBooks.length} livros encontrados na imagem e adicionados à lista de desejos!`);
          } else {
             alert('Não foi possível identificar livros na imagem. Tente uma imagem mais clara.');
          }
        }
        setIsImporting(false);
        // Clear input
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsImporting(false);
      alert('Erro ao processar imagem.');
    }
  };

  const filteredBooks = books.filter(b => {
    if (view === 'wishlist' && !b.isWishlist) return false;
    if (view === 'library' && b.isWishlist) return false;
    
    // Search
    const lowerSearch = searchTerm.toLowerCase();
    return b.title.toLowerCase().includes(lowerSearch) || 
           b.author.toLowerCase().includes(lowerSearch) ||
           b.genre.some(g => g.toLowerCase().includes(lowerSearch));
  });

  const renderBookCard = (book: Book) => {
    const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
    
    return (
      <div key={book.id} className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden flex flex-col hover:shadow-md transition group">
        <div className="h-32 bg-brand-200 relative p-4 flex items-end justify-between">
            {/* Placeholder Cover Art */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 opacity-20"></div>
            <div className="relative z-10 w-full">
                 <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-brand-900 bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
                        {book.genre[0] || 'Geral'}
                    </span>
                    <button 
                        onClick={() => { setEditingBook(book); setView('add'); }}
                        className="p-1.5 bg-white/90 rounded-full text-gray-600 hover:text-brand-700 opacity-0 group-hover:opacity-100 transition"
                    >
                        <MoreVertical size={16} />
                    </button>
                 </div>
            </div>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 line-clamp-1" title={book.title}>{book.title}</h3>
          <p className="text-sm text-gray-500 mb-2">{book.author}</p>
          
          <div className="mt-auto space-y-3">
             {/* Progress Bar */}
             {!book.isWishlist && (
                <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{progress}% Lido</span>
                        <span>{book.currentPage}/{book.totalPages}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                book.status === BookStatus.COMPLETED ? 'bg-green-500' : 'bg-brand-500'
                            }`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
             )}

             <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1" title="Dono">
                    <User size={12} />
                    {book.owner}
                </div>
                <div className="flex items-center gap-1" title="Localização">
                    <MapPin size={12} />
                    <span className="max-w-[80px] truncate">{book.location || book.format}</span>
                </div>
             </div>
          </div>
        </div>
        
        <div className="flex border-t border-gray-100">
             <button 
                onClick={() => handleDeleteBook(book.id)}
                className="flex-1 py-2 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 transition"
             >
                Remover
             </button>
             <button 
                 onClick={() => { setEditingBook(book); setView('add'); }}
                 className="flex-1 py-2 text-xs text-brand-600 hover:bg-brand-50 font-medium transition"
             >
                Editar
             </button>
        </div>
      </div>
    );
  };

  const NavItem = ({ id, icon: Icon, label }: { id: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => { setView(id); setEditingBook(undefined); }}
      className={`flex flex-col md:flex-row items-center gap-2 p-3 rounded-lg transition w-full md:w-auto ${
        view === id 
        ? 'bg-brand-100 text-brand-800 font-medium' 
        : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span className="text-xs md:text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fdf8f6]">
      {/* Sidebar / Mobile Bottom Nav */}
      <nav className="fixed md:sticky bottom-0 md:top-0 w-full md:w-64 bg-white md:h-screen border-t md:border-r border-brand-100 z-50 flex md:flex-col justify-around md:justify-start md:p-6 shadow-lg md:shadow-none">
        <div className="hidden md:flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                <Library size={20} />
            </div>
            <h1 className="text-xl font-bold text-brand-900 tracking-tight">BiblioGestor</h1>
        </div>

        <div className="flex md:flex-col w-full gap-1 md:gap-2">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Visão Geral" />
            <NavItem id="library" icon={BookIcon} label="Minha Estante" />
            <NavItem id="wishlist" icon={Heart} label="Lista de Desejos" />
        </div>

        <div className="hidden md:block mt-auto">
             <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
                <h4 className="text-sm font-bold text-brand-800 flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-purple-500" /> AI Insights
                </h4>
                <p className="text-xs text-gray-600 mb-3">Obtenha recomendações baseadas na sua biblioteca atual.</p>
                <button 
                    onClick={generateRecs}
                    disabled={loadingRecs}
                    className="w-full py-2 bg-white border border-brand-200 rounded-lg text-xs font-bold text-brand-700 hover:bg-brand-100 transition"
                >
                    {loadingRecs ? 'Analisando...' : 'Gerar Dicas'}
                </button>
             </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 mb-20 md:mb-0 overflow-y-auto">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {view === 'dashboard' && 'Painel de Controle'}
                    {view === 'library' && 'Minha Biblioteca'}
                    {view === 'wishlist' && 'Lista de Desejos'}
                    {view === 'add' && (editingBook ? 'Editar Livro' : 'Adicionar Livro')}
                </h2>
                <p className="text-gray-500 text-sm">
                    {view === 'dashboard' ? `Olá! Você tem ${books.length} livros registrados.` : 'Gerencie sua coleção de forma inteligente.'}
                </p>
            </div>

            {view !== 'add' && (
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar título, autor..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-brand-200 transition"
                        />
                    </div>
                    
                    {/* Import Legacy Button */}
                    {view === 'dashboard' && books.length < 50 && (
                        <button 
                             onClick={handleLoadLegacyData}
                             className="bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition hover:bg-indigo-50"
                        >
                            <Database size={18} /> <span className="hidden sm:inline">Importar Planilha (Demo)</span>
                        </button>
                    )}

                    {/* Upload Button for Wishlist */}
                    {view === 'wishlist' && (
                        <>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                                className="bg-white text-brand-700 border border-brand-200 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition hover:bg-brand-50"
                                title="Importar livros de uma foto"
                            >
                                {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} 
                                <span className="hidden sm:inline">{isImporting ? 'Processando...' : 'Importar Foto'}</span>
                            </button>
                        </>
                    )}

                    <button 
                        onClick={() => { setEditingBook(undefined); setView('add'); }}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition shadow-md shadow-brand-200"
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">Adicionar</span>
                    </button>
                </div>
            )}
        </div>

        {/* View Routing */}
        
        {view === 'add' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BookForm 
                    onSave={handleSaveBook} 
                    onCancel={() => setView('library')} 
                    initialData={editingBook}
                    isWishlistMode={view === 'wishlist'}
                />
            </div>
        )}

        {view === 'dashboard' && (
             <div className="animate-in fade-in duration-500 space-y-8">
                <LibraryStats books={books} />
                
                {recommendations.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
                        <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                            <Sparkles className="text-purple-600" /> Recomendações para Você
                        </h3>
                        <ul className="space-y-2">
                            {recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg shadow-sm">
                                    <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0">{idx + 1}</span>
                                    <span className="text-gray-700 font-medium">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Leituras Recentes</h3>
                        <button onClick={() => setView('library')} className="text-sm text-brand-600 hover:underline">Ver tudo</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {books
                            .filter(b => b.status === BookStatus.READING || b.status === BookStatus.COMPLETED)
                            .sort((a, b) => b.addedAt - a.addedAt)
                            .slice(0, 4)
                            .map(renderBookCard)
                        }
                    </div>
                </div>
             </div>
        )}

        {(view === 'library' || view === 'wishlist') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {filteredBooks.length > 0 ? (
                    filteredBooks.map(renderBookCard)
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <BookOpen size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Nenhum livro encontrado.</p>
                        <p className="text-sm">Tente ajustar a busca ou adicione um novo livro.</p>
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
};

export default App;