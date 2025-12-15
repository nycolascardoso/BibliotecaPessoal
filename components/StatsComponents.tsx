import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Book, BookStatus, Owner } from '../types';

interface StatsProps {
  books: Book[];
}

const COLORS = ['#a18072', '#5d453b', '#d2bab0', '#8a6a5c', '#4a362f'];

export const LibraryStats: React.FC<StatsProps> = ({ books }) => {
  // Filter out wishlist items for stats
  const libraryBooks = books.filter(b => !b.isWishlist);
  const wishlistCount = books.filter(b => b.isWishlist).length;

  // 1. Status Distribution
  const statusData = [
    { name: 'Não Lido', value: libraryBooks.filter(b => b.status === BookStatus.UNREAD).length },
    { name: 'Lendo', value: libraryBooks.filter(b => b.status === BookStatus.READING).length },
    { name: 'Lido', value: libraryBooks.filter(b => b.status === BookStatus.COMPLETED).length },
  ];

  // 2. Genre Distribution (Top 5)
  const genreMap: Record<string, number> = {};
  libraryBooks.forEach(book => {
    book.genre.forEach(g => {
      genreMap[g] = (genreMap[g] || 0) + 1;
    });
  });
  const genreData = Object.entries(genreMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 3. Owner Distribution
  const ownerData = [
    { name: 'Eu', value: libraryBooks.filter(b => b.owner === Owner.ME).length },
    { name: 'Esposa', value: libraryBooks.filter(b => b.owner === Owner.SPOUSE).length },
  ];

  // 4. Reading Progress (Pages read vs Total)
  const totalPages = libraryBooks.reduce((acc, b) => acc + (b.totalPages || 0), 0);
  const pagesRead = libraryBooks.reduce((acc, b) => {
    if (b.status === BookStatus.COMPLETED) return acc + (b.totalPages || 0);
    return acc + (b.currentPage || 0);
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* KPI Cards */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase">Total na Biblioteca</h3>
        <p className="text-3xl font-bold text-brand-800 mt-2">{libraryBooks.length}</p>
        <p className="text-xs text-brand-600 mt-1">Livros físicos e digitais</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase">Na Lista de Desejos</h3>
        <p className="text-3xl font-bold text-indigo-600 mt-2">{wishlistCount}</p>
        <p className="text-xs text-indigo-400 mt-1">Metas futuras</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase">Páginas Lidas</h3>
        <p className="text-3xl font-bold text-green-600 mt-2">{pagesRead.toLocaleString()}</p>
        <p className="text-xs text-green-400 mt-1">de {totalPages.toLocaleString()} totais</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100 flex flex-col justify-center">
         <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-brand-600 h-2.5 rounded-full" style={{ width: `${totalPages > 0 ? (pagesRead/totalPages)*100 : 0}%` }}></div>
         </div>
         <p className="text-xs text-right mt-1 text-gray-500">Progresso Geral</p>
      </div>

      {/* Charts */}
      <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-brand-100 min-h-[300px]">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Status de Leitura</h3>
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{fill: '#f2e8e5'}} />
                    <Bar dataKey="value" fill="#a18072" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-brand-100 min-h-[300px]">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Gêneros Favoritos</h3>
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {genreData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 text-xs text-gray-500 mt-2 flex-wrap">
            {genreData.map((g, i) => (
                <span key={g.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                    {g.name}
                </span>
            ))}
        </div>
      </div>
    </div>
  );
};