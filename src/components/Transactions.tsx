import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, ArrowLeft, Trash2, ShoppingBag, Car, Coffee, Home, Zap, CreditCard, Filter, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TransactionsProps {
  onBack: () => void;
}

const CATEGORY_STYLES: Record<string, { color: string, bg: string }> = {
  'Alimentação': { color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  'Transporte': { color: 'text-pink-400', bg: 'bg-pink-400/10' },
  'Lazer': { color: 'text-amber-400', bg: 'bg-amber-400/10' },
  'Moradia': { color: 'text-purple-400', bg: 'bg-purple-400/10' },
  'Contas': { color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  'Outros': { color: 'text-zinc-400', bg: 'bg-zinc-400/10' }
};

const CATEGORY_ICONS: Record<string, any> = {
  'Alimentação': ShoppingBag,
  'Transporte': Car,
  'Lazer': Coffee,
  'Moradia': Home,
  'Contas': Zap,
  'Outros': CreditCard
};

export function Transactions({ onBack }: TransactionsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const fetchTransactions = async (uid?: string) => {
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    if (isTestMode) {
      const mockTxs = JSON.parse(localStorage.getItem('adielpay_mock_txs') || '[]');
      mockTxs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(mockTxs);
      return;
    }

    if (!uid) return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false });
    if (!error && data) {
      setTransactions(data);
    }
  };

  useEffect(() => {
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    if (isTestMode) {
      fetchTransactions();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchTransactions(session.user.id);
      }
    });
  }, []);

  const handleDeleteTransaction = async (id: string) => {
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    try {
      if (isTestMode) {
        const mockTxs = JSON.parse(localStorage.getItem('adielpay_mock_txs') || '[]');
        const updatedTxs = mockTxs.filter((tx: any) => tx.id !== id);
        localStorage.setItem('adielpay_mock_txs', JSON.stringify(updatedTxs));
        fetchTransactions();
      } else {
        await supabase.from('transactions').delete().eq('id', id);
        if (userId) fetchTransactions(userId);
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && tx.date >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && tx.date <= endDate;
      }
      
      let matchesCategory = true;
      if (selectedCategory !== 'Todas') {
        matchesCategory = tx.category === selectedCategory;
      }

      let matchesSearch = true;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const cat = (tx.category || '').toLowerCase();
        matchesSearch = desc.includes(query) || cat.includes(query);
      }
      
      return matchesDate && matchesCategory && matchesSearch;
    });
  }, [transactions, startDate, endDate, selectedCategory, searchQuery]);

  const categories = ['Todas', ...Object.keys(CATEGORY_STYLES)];

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 pb-20 md:pb-6">
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center shadow-sm">
                <Wallet className="w-5 h-5 text-zinc-100" />
              </div>
              <span className="font-futuristic font-bold text-xl">AdPay</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Todas as Transações</h1>
            <p className="text-slate-400 mt-1">Histórico completo de movimentações.</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-auto flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Data Inicial</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="w-full md:w-auto flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Data Final</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="w-full md:w-auto flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Categoria</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); setSelectedCategory('Todas'); setSearchQuery(''); }}
              className="w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 h-[38px]"
            >
              <Filter className="w-4 h-4" /> Limpar
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
        >
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center text-slate-500 py-8">Nenhuma transação encontrada.</div>
            ) : (
              filteredTransactions.map((tx) => {
                const isReceita = tx.amount > 0;
                const categoryStyles = CATEGORY_STYLES[tx.category] || CATEGORY_STYLES['Outros'];
                const IconComponent = isReceita ? TrendingUp : (CATEGORY_ICONS[tx.category] || CATEGORY_ICONS['Outros']);
                const colorClass = isReceita ? 'text-emerald-400' : categoryStyles.color;
                const bgClass = isReceita ? 'bg-emerald-400/10' : categoryStyles.bg;
                
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass}`}>
                        <IconComponent className={`w-6 h-6 ${colorClass}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-100">{tx.description}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span>{tx.category}</span>
                          <span>•</span>
                          <span>{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`font-semibold ${isReceita ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {isReceita ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2).replace('.', ',')}
                      </div>
                      <button 
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
