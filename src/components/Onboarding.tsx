import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Wallet, User, Landmark } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { setUserName, setBalance } = useFinance();
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      setUserName(name);
      setBalance(parseFloat(initialBalance) || 0);
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Landmark className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Bem-vindo ao AdielVibe!</h2>
        <p className="text-slate-400 text-center mb-8">Vamos configurar sua conta para começar.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Como devemos te chamar?</label>
            <div className="relative">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Seu nome"
                required
              />
              <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Saldo atual na conta (R$)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="0.00"
              />
              <Wallet className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all"
          >
            Começar a usar <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
