import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export function TransactionList({ type, onBack }: { type: 'income' | 'expense', onBack: () => void }) {
  const { transactions } = useFinance();
  const filtered = transactions.filter(t => t.type === type);
  
  const isIncome = type === 'income';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-lg">
            {isIncome ? 'Todas as Receitas' : 'Todas as Despesas'}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
              {isIncome ? <TrendingUp className="w-10 h-10 text-slate-600" /> : <TrendingDown className="w-10 h-10 text-slate-600" />}
            </div>
            <h2 className="text-xl font-semibold text-slate-300 mb-2">Nenhuma transação encontrada</h2>
            <p className="text-slate-500">Você ainda não possui {isIncome ? 'receitas' : 'despesas'} registradas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(tx => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={tx.id} 
                className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-400/10 text-emerald-400' : 'bg-pink-400/10 text-pink-400'}`}>
                    {isIncome ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-100">{tx.description}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${isIncome ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {isIncome ? '+' : '-'}R$ {tx.amount.toFixed(2).replace('.', ',')}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
