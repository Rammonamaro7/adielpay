import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, ArrowUpRight, Landmark, ArrowLeft, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Investment {
  id: string;
  name: string;
  amount: number;
  type: string;
}

interface InvestmentsProps {
  onBack: () => void;
}

export function Investments({ onBack }: InvestmentsProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState('Renda Fixa');
  const [userId, setUserId] = useState<string | null>(null);

  const fetchInvestments = async (uid?: string) => {
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    if (isTestMode) {
      setInvestments(JSON.parse(localStorage.getItem('adielpay_mock_investments') || '[]'));
      return;
    }
    
    if (!uid) return;

    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setInvestments(data);
    }
  };

  useEffect(() => {
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    if (isTestMode) {
      if (!localStorage.getItem('adielpay_mock_investments')) {
        const mockInvest = [
          { id: '1', name: 'Tesouro Direto', amount: 3500, type: 'Renda Fixa' },
          { id: '2', name: 'Ações BR', amount: 1200, type: 'Renda Variável' }
        ];
        localStorage.setItem('adielpay_mock_investments', JSON.stringify(mockInvest));
      }
      fetchInvestments();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchInvestments(session.user.id);
      }
    });
  }, []);

  const totalPatrimony = investments.reduce((acc, inv) => acc + inv.amount, 0);

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    if (newName && newAmount && (userId || isTestMode)) {
      try {
        if (isTestMode) {
          const mockInvestments = JSON.parse(localStorage.getItem('adielpay_mock_investments') || '[]');
          mockInvestments.push({
            id: Math.random().toString(),
            name: newName,
            amount: parseFloat(newAmount),
            type: newType
          });
          localStorage.setItem('adielpay_mock_investments', JSON.stringify(mockInvestments));
        } else {
          await supabase.from('investments').insert([{
            user_id: userId,
            name: newName,
            amount: parseFloat(newAmount),
            type: newType,
            date: new Date().toISOString().split('T')[0]
          }]);
        }
        fetchInvestments(userId!);
        setIsModalOpen(false);
        setNewName('');
        setNewAmount('');
      } catch (error) {
        console.error("Error adding investment:", error);
      }
    }
  };

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
              <span className="font-bold text-xl tracking-tight">Adielpay</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Investimentos</h1>
            <p className="text-slate-400 mt-1">Acompanhe o rendimento do seu patrimônio.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-100 hover:bg-white text-zinc-900 px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <TrendingUp className="w-5 h-5" /> Novo Investimento
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-medium">Patrimônio Total</h3>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Landmark className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPatrimony)}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +0.0%
              </span>
              <span className="text-slate-500">este mês</span>
            </div>
          </motion.div>
        </div>

        {investments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center min-h-[300px]"
          >
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum investimento ainda</h3>
            <p className="text-slate-400 max-w-md">
              Comece a investir seu dinheiro para ver seu patrimônio crescer. Adicione seu primeiro investimento para acompanhar os rendimentos.
            </p>
          </motion.div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-semibold mb-6">Meus Investimentos</h3>
            <div className="space-y-4">
              {investments.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{inv.name}</h4>
                      <p className="text-sm text-slate-400">{inv.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inv.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Investment Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Novo Investimento</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddInvestment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Investimento</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Ex: Tesouro Direto"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Ex: 1000.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none"
                  >
                    <option value="Renda Fixa">Renda Fixa</option>
                    <option value="Ações">Ações</option>
                    <option value="Fundos Imobiliários">Fundos Imobiliários</option>
                    <option value="Criptomoedas">Criptomoedas</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full mt-6 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-xl px-4 py-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Adicionar Investimento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
