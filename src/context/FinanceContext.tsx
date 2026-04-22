import React, { createContext, useContext, useState } from 'react';
import { Transaction, Budget } from '../types';

interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  budgets: Budget[];
  addBudget: (b: Omit<Budget, 'id'>) => void;
  balance: number;
  setBalance: (b: number) => void;
  userName: string;
  setUserName: (n: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState('');

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx = { ...t, id: Date.now().toString() };
    setTransactions(prev => [newTx, ...prev]);
    
    if (t.type === 'income') {
      setBalance(prev => prev + t.amount);
    } else {
      setBalance(prev => prev - t.amount);
      // Update budgets if expense
      setBudgets(prev => prev.map(b => 
        b.category === t.category ? { ...b, spent: b.spent + t.amount } : b
      ));
    }
  };

  const addBudget = (b: Omit<Budget, 'id'>) => {
    setBudgets(prev => [...prev, { ...b, id: Date.now().toString() }]);
  };

  return (
    <FinanceContext.Provider value={{ 
      transactions, addTransaction, 
      budgets, addBudget, 
      balance, setBalance, 
      userName, setUserName 
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
