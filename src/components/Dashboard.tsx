import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, CreditCard, 
  ArrowUpRight, ArrowDownRight, Plus, Landmark,
  Coffee, ShoppingBag, Car, Home, Zap, Target, X, Pencil, Trash2, Calendar, LogOut, FileText, Sparkles,
  Eye, EyeOff, QrCode, Barcode, ArrowRightLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateFinancialInsights } from '../lib/gemini';
import Markdown from 'react-markdown';
import { Joyride, Step, CallBackProps, STATUS } from 'react-joyride';

const RECENT_TRANSACTIONS: any[] = [];

interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  spent: number;
  color: string;
}

const INITIAL_BUDGETS: Budget[] = [];

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': 'bg-blue-500',
  'Transporte': 'bg-indigo-500',
  'Lazer': 'bg-amber-500',
  'Moradia': 'bg-purple-500',
  'Contas': 'bg-emerald-500',
  'Outros': 'bg-slate-400'
};

const CATEGORY_ICONS: Record<string, any> = {
  'Alimentação': ShoppingBag,
  'Transporte': Car,
  'Lazer': Coffee,
  'Moradia': Home,
  'Contas': Zap,
  'Outros': CreditCard
};

const CATEGORY_STYLES: Record<string, { color: string, bg: string }> = {
  'Alimentação': { color: 'text-blue-600', bg: 'bg-blue-50' },
  'Transporte': { color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'Lazer': { color: 'text-amber-600', bg: 'bg-amber-50' },
  'Moradia': { color: 'text-purple-600', bg: 'bg-purple-50' },
  'Contas': { color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Outros': { color: 'text-slate-500', bg: 'bg-slate-100' }
};

interface DashboardProps {
  userName: string;
  isPremium: boolean;
  onNavigateToPremium: () => void;
  onNavigateToBank: () => void;
  onNavigateToProfile: () => void;
  onNavigateToInvestments: () => void;
  onNavigateToTransactions: () => void;
  onNavigateToReports: () => void;
  onNavigateToProjections: () => void;
}

export function Dashboard({ 
  userName, 
  isPremium,
  onNavigateToPremium,
  onNavigateToBank, 
  onNavigateToProfile, 
  onNavigateToInvestments, 
  onNavigateToTransactions, 
  onNavigateToReports,
  onNavigateToProjections
}: DashboardProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [userId, setUserId] = useState<string | null>(null);
  
  const [runTour, setRunTour] = useState(() => {
    return localStorage.getItem('adielpay_tour_completed') !== 'true';
  });

  const tourSteps: Step[] = [
    {
      target: '.tour-greeting',
      content: 'Bem-vindo ao Adielpay! Vamos dar uma volta rápida para você conhecer as principais funcionalidades.',
      disableBeacon: true,
    },
    {
      target: '.tour-balance',
      content: 'Aqui você acompanha o saldo total da sua conta e a evolução em relação ao mês passado.',
    },
    {
      target: '.tour-add-transaction',
      content: 'Registre suas receitas e despesas manualmente por aqui.',
    },
    {
      target: '.tour-bank',
      content: 'Quer automatizar? Conecte seu banco e importe suas transações automaticamente (Recurso PRO).',
    },
    {
      target: '.tour-insights',
      content: 'Receba dicas e análises inteligentes sobre seus gastos usando nossa Inteligência Artificial.',
    },
    {
      target: '.tour-reports',
      content: 'Acesse relatórios detalhados e exporte para PDF ou Excel.',
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('adielpay_tour_completed', 'true');
    }
  };

  const fetchBudgets = async (uid?: string) => {
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    if (isTestMode) {
      setBudgets(JSON.parse(localStorage.getItem('adielpay_mock_budgets') || '[]'));
      return;
    }
    if (!uid) return;
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', uid);
    if (!error && data) {
      setBudgets(data);
    }
  };

  const fetchTransactions = async (uid?: string) => {
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    if (isTestMode) {
      const mockTxs = JSON.parse(localStorage.getItem('adielpay_mock_txs') || '[]');
      // Sort by date descending
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
      fetchBudgets();
      fetchTransactions();
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchBudgets(session.user.id);
        fetchTransactions(session.user.id);
      }
    });
  }, []);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAdjustBalanceModalOpen, setIsAdjustBalanceModalOpen] = useState(false);
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsText, setInsightsText] = useState('');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [newBudgetCategory, setNewBudgetCategory] = useState('Moradia');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');
  const [isAddingCustomCategoryBudget, setIsAddingCustomCategoryBudget] = useState(false);
  const [customCategoryInputBudget, setCustomCategoryInputBudget] = useState('');
  
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('Alimentação');
  const [isAddingCustomCategoryExpense, setIsAddingCustomCategoryExpense] = useState(false);
  const [customCategoryInputExpense, setCustomCategoryInputExpense] = useState('');

  const customCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(tx => {
      if (tx.category && tx.category !== 'Receita' && !CATEGORY_ICONS[tx.category]) {
        cats.add(tx.category);
      }
    });
    budgets.forEach(b => {
      if (b.category && !CATEGORY_ICONS[b.category]) {
        cats.add(b.category);
      }
    });
    return Array.from(cats);
  }, [transactions, budgets]);

  const openAddModal = () => {
    setEditingBudgetId(null);
    setNewBudgetCategory('Moradia');
    setNewBudgetLimit('');
    setIsBudgetModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setNewBudgetCategory(budget.category);
    setNewBudgetLimit(budget.limit.toString());
    setIsBudgetModalOpen(true);
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await supabase.from('budgets').delete().eq('id', id);
      fetchBudgets(userId!);
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetLimit || (!userId && localStorage.getItem('adielpay_test_mode') !== 'true')) return;
    
    const finalCategory = isAddingCustomCategoryBudget && customCategoryInputBudget.trim() 
      ? customCategoryInputBudget.trim() 
      : newBudgetCategory;

    if (!finalCategory) return;

    try {
      const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
      if (isTestMode) {
        const mockBudgets = JSON.parse(localStorage.getItem('adielpay_mock_budgets') || '[]');
        if (editingBudgetId) {
          const index = mockBudgets.findIndex((b: any) => b.id === editingBudgetId);
          if (index !== -1) {
            mockBudgets[index].category = finalCategory;
            mockBudgets[index].limit_amount = parseFloat(newBudgetLimit);
          }
        } else {
          mockBudgets.push({
            id: Math.random().toString(),
            category: finalCategory,
            limit_amount: parseFloat(newBudgetLimit),
            color: CATEGORY_COLORS[finalCategory] || 'bg-slate-500'
          });
        }
        localStorage.setItem('adielpay_mock_budgets', JSON.stringify(mockBudgets));
      } else {
        if (editingBudgetId) {
          await supabase.from('budgets').update({
            category: finalCategory,
            limit_amount: parseFloat(newBudgetLimit),
            color: CATEGORY_COLORS[finalCategory] || 'bg-slate-500'
          }).eq('id', editingBudgetId);
        } else {
          await supabase.from('budgets').insert([{
            user_id: userId,
            category: finalCategory,
            limit_amount: parseFloat(newBudgetLimit),
            color: CATEGORY_COLORS[finalCategory] || 'bg-slate-500',
          }]);
        }
      }
      fetchBudgets(userId);
      setIsBudgetModalOpen(false);
      setEditingBudgetId(null);
      setNewBudgetLimit('');
      setIsAddingCustomCategoryBudget(false);
      setCustomCategoryInputBudget('');
    } catch (error) {
      console.error("Error saving budget:", error);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    if (!newExpenseTitle || !newExpenseAmount || (!userId && !isTestMode)) return;

    const amount = parseFloat(newExpenseAmount);
    if (isNaN(amount)) return;

    const finalCategory = isAddingCustomCategoryExpense && customCategoryInputExpense.trim()
      ? customCategoryInputExpense.trim()
      : newExpenseCategory;

    if (!finalCategory) return;

    const isReceita = finalCategory === 'Receita';
    const finalAmount = isReceita ? Math.abs(amount) : -Math.abs(amount);

    try {
      if (isTestMode) {
        const mockTxs = JSON.parse(localStorage.getItem('adielpay_mock_txs') || '[]');
        mockTxs.push({
          id: Math.random().toString(),
          description: newExpenseTitle,
          category: finalCategory,
          amount: finalAmount,
          type: isReceita ? 'income' : 'expense',
          date: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem('adielpay_mock_txs', JSON.stringify(mockTxs));
      } else {
        await supabase.from('transactions').insert([{
          user_id: userId,
          description: newExpenseTitle,
          category: finalCategory,
          amount: finalAmount,
          type: isReceita ? 'income' : 'expense',
          date: new Date().toISOString().split('T')[0]
        }]);
      }

      fetchTransactions(userId);
      setIsExpenseModalOpen(false);
      setNewExpenseTitle('');
      setNewExpenseAmount('');
      setNewExpenseCategory('Alimentação');
      setIsAddingCustomCategoryExpense(false);
      setCustomCategoryInputExpense('');
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualBalanceInput || !userId) return;

    let clean = actualBalanceInput.toString().replace(/R\$/g, '').trim();
    if (clean.includes('.') && clean.includes(',')) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastComma > lastDot) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }

    const actualBalance = parseFloat(clean);
    if (isNaN(actualBalance)) return;

    const difference = actualBalance - totalBalance;

    if (Math.abs(difference) > 0.001) {
      try {
        await supabase.from('transactions').insert([{
          user_id: userId,
          description: 'Ajuste de Saldo',
          category: 'Outros',
          amount: difference,
          type: difference > 0 ? 'income' : 'expense',
          date: new Date().toISOString().split('T')[0]
        }]);
        fetchTransactions(userId);
        setIsAdjustBalanceModalOpen(false);
        setActualBalanceInput('');
      } catch (error) {
        console.error("Error adjusting balance:", error);
      }
    } else {
      setIsAdjustBalanceModalOpen(false);
      setActualBalanceInput('');
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (!tx.date) return false;
      const txMonth = tx.date.substring(0, 7); // YYYY-MM
      return txMonth === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  const budgetsWithSpent = useMemo(() => {
    return budgets.map(budget => {
      const spent = filteredTransactions
        .filter(tx => tx.category === budget.category && tx.amount < 0)
        .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
      return { ...budget, spent };
    });
  }, [budgets, filteredTransactions]);

  const totalBalance = transactions.reduce((acc, tx) => acc + tx.amount, 0); // Total balance is all time
  const totalIncome = filteredTransactions.filter(tx => tx.amount > 0).reduce((acc, tx) => acc + tx.amount, 0);
  const totalExpense = filteredTransactions.filter(tx => tx.amount < 0).reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  const expenseDataMap: Record<string, number> = {};
  filteredTransactions.forEach(tx => {
    if (tx.amount < 0) {
      expenseDataMap[tx.category] = (expenseDataMap[tx.category] || 0) + Math.abs(tx.amount);
    }
  });

  const EXPENSE_DATA = Object.entries(expenseDataMap).map(([name, value]) => {
    let color = '#a1a1aa'; // zinc-400
    if (name === 'Alimentação') color = '#22d3ee'; // cyan-400
    if (name === 'Transporte') color = '#f472b6'; // pink-400
    if (name === 'Lazer') color = '#fbbf24'; // amber-400
    if (name === 'Moradia') color = '#c084fc'; // purple-400
    if (name === 'Contas') color = '#34d399'; // emerald-400
    return { name, value, color };
  });

  const MONTHLY_DATA = useMemo(() => {
    const data = [];
    
    // First, calculate the total balance up to 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    let cumulativeBalance = transactions
      .filter(tx => new Date(tx.date) < sixMonthsAgo)
      .reduce((acc, tx) => acc + tx.amount, 0);

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleString('pt-BR', { month: 'short' });
      
      const monthTxs = transactions.filter(tx => tx.date && tx.date.substring(0, 7) === monthStr);
      const rec = monthTxs.filter(tx => tx.amount > 0).reduce((acc, tx) => acc + tx.amount, 0);
      const des = monthTxs.filter(tx => tx.amount < 0).reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
      
      cumulativeBalance += (rec - des);
      
      data.push({ 
        name: monthName, 
        receitas: rec, 
        despesas: des,
        saldo: cumulativeBalance
      });
    }
    return data;
  }, [transactions]);

  const monthlyAverageNet = useMemo(() => {
    if (MONTHLY_DATA.length === 0) return 0;
    let totalNet = 0;
    MONTHLY_DATA.forEach(month => {
      totalNet += (month.receitas - month.despesas);
    });
    return totalNet / MONTHLY_DATA.length;
  }, [MONTHLY_DATA]);

  const projectedBalance6Months = totalBalance + (monthlyAverageNet * 6);
  const projectionIsPositive = projectedBalance6Months >= totalBalance;

  const handleLogout = async () => {
    try {
      localStorage.removeItem('adielpay_test_mode');
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error("Erro ao sair", error);
    }
  };

  const handleGenerateInsights = async () => {
    if (!isPremium) {
      onNavigateToPremium();
      return;
    }

    setIsInsightsModalOpen(true);
    setInsightsLoading(true);
    setInsightsText('');
    
    const insights = await generateFinancialInsights(
      transactions,
      budgets,
      totalBalance
    );
    
    setInsightsText(insights);
    setInsightsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20 md:pb-6">
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#3b82f6', // blue-500
            textColor: '#0f172a', // slate-900
            backgroundColor: '#ffffff',
            arrowColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
          },
          beaconInner: {
            backgroundColor: '#60a5fa', // blue-400
          },
          beaconOuter: {
            backgroundColor: 'rgba(96, 165, 250, 0.2)',
            borderColor: '#60a5fa',
          },
          tooltip: {
            borderRadius: '16px',
            padding: '24px',
          },
          buttonNext: {
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 600,
          },
          buttonBack: {
            color: '#64748b',
            marginRight: '8px',
          },
          buttonSkip: {
            color: '#94a3b8',
          }
        }}
        locale={{
          back: 'Anterior',
          close: 'Fechar',
          last: 'Concluir',
          next: 'Próximo',
          skip: 'Pular',
        }}
      />
      {/* Top Navigation / Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5 text-zinc-100" />
            </div>
            <span className="font-bold text-xl tracking-tight">Adielpay</span>
            {isPremium ? (
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">PRO</span>
            ) : (
              <button 
                onClick={onNavigateToPremium}
                className="bg-gradient-to-r from-amber-400/20 to-amber-600/20 text-amber-500 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hover:bg-amber-500/30 transition-colors ml-1"
              >
                Seja Premium
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onNavigateToInvestments}
              className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full text-sm font-medium transition-colors border border-slate-700"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Investimentos
            </button>
            <button 
              onClick={onNavigateToReports}
              className="tour-reports hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full text-sm font-medium transition-colors border border-slate-700"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              Relatórios
            </button>
            <button 
              onClick={onNavigateToProfile}
              className="w-10 h-10 rounded-full bg-zinc-700 p-[2px] transition-transform hover:scale-105"
            >
              <div className="w-full h-full rounded-full bg-slate-900 border-2 border-transparent overflow-hidden">
                <img src="https://picsum.photos/seed/user/100/100" alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </button>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-red-500"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Quick Actions */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="tour-greeting text-3xl font-bold text-slate-900">Olá, {userName}</h1>
              <p className="text-slate-500 mt-1">Aqui está o resumo das suas finanças hoje.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Quick Actions Carousel (Nubank Style) */}
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x">
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="tour-add-transaction flex flex-col items-center gap-2 min-w-[80px] snap-start group"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-slate-900" />
              </div>
              <span className="text-xs font-medium text-slate-700">Nova Transação</span>
            </button>

            <button 
              onClick={onNavigateToBank}
              className="tour-bank flex flex-col items-center gap-2 min-w-[80px] snap-start group"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                <Landmark className="w-6 h-6 text-slate-900" />
              </div>
              <span className="text-xs font-medium text-slate-700">Conectar Banco</span>
            </button>

            <button 
              onClick={handleGenerateInsights}
              className="tour-insights flex flex-col items-center gap-2 min-w-[80px] snap-start group"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-indigo-700">Insights IA</span>
            </button>

            <button 
              onClick={isPremium ? onNavigateToProjections : onNavigateToPremium}
              className="flex flex-col items-center gap-2 min-w-[80px] snap-start group"
            >
              <div className="relative w-16 h-16 rounded-full bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                <Target className="w-6 h-6 text-amber-600" />
                {!isPremium && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border-2 border-white">
                    PRO
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-amber-700">Projeções</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="tour-balance bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 z-0"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-slate-500 font-medium">Conta</h3>
              <button 
                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={isBalanceVisible ? "Ocultar saldo" : "Mostrar saldo"}
              >
                {isBalanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <p className={`text-3xl font-bold text-slate-900 ${!isBalanceVisible ? 'tracking-widest' : ''}`}>
                {isBalanceVisible 
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)
                  : 'R$ •••••'}
              </p>
              <button 
                onClick={() => {
                  setActualBalanceInput(totalBalance.toFixed(2).replace('.', ','));
                  setIsAdjustBalanceModalOpen(true);
                }}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Ajustar Saldo"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm relative z-10">
              <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <ArrowUpRight className="w-3 h-3 mr-1" /> 0.0%
              </span>
              <span className="text-slate-400">vs. mês passado</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 z-0"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-slate-500 font-medium">Receitas (Mês)</h3>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className={`text-3xl font-bold text-slate-900 mb-2 relative z-10 ${!isBalanceVisible ? 'tracking-widest' : ''}`}>
              {isBalanceVisible 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)
                : 'R$ •••••'}
            </p>
            <div className="flex items-center gap-2 text-sm relative z-10">
              <span className="text-slate-400">100% recebido</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-10 -mt-10 z-0"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-slate-500 font-medium">Despesas (Mês)</h3>
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <p className={`text-3xl font-bold text-slate-900 mb-2 relative z-10 ${!isBalanceVisible ? 'tracking-widest' : ''}`}>
              {isBalanceVisible 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)
                : 'R$ •••••'}
            </p>
            <div className="flex items-center gap-2 text-sm relative z-10">
              <span className="flex items-center text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                <ArrowDownRight className="w-3 h-3 mr-1" /> 0.0%
              </span>
              <span className="text-slate-400">vs. mês passado</span>
            </div>
          </motion.div>

          {/* Projeção Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 z-0"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-slate-500 font-medium text-sm lg:text-base">Projeção (6 Meses)</h3>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className={`text-2xl lg:text-3xl font-bold text-slate-900 mb-2 relative z-10 ${!isBalanceVisible ? 'tracking-widest' : ''}`}>
              {isBalanceVisible 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projectedBalance6Months)
                : 'R$ •••••'}
            </p>
            <div className="flex items-center gap-2 text-sm relative z-10">
              <span className={`flex items-center px-2 py-0.5 rounded-md ${projectionIsPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {projectionIsPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                Média de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyAverageNet)}/mês
              </span>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categorization Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold mb-6 text-slate-900">Despesas por Categoria</h3>
            <div className="h-[250px] w-full">
              {EXPENSE_DATA.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Nenhuma despesa registrada.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={EXPENSE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {EXPENSE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', color: '#0f172a' }}
                      itemStyle={{ color: '#0f172a' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-3 mt-4">
              {EXPENSE_DATA.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Cashflow Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Fluxo de Caixa</h3>
              <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Últimos 6 meses</option>
                <option>Este ano</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              {MONTHLY_DATA.every(m => m.receitas === 0 && m.despesas === 0) ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Nenhuma movimentação registrada nos últimos 6 meses.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} tickFormatter={(value) => `R$${(value/1000).toFixed(1)}k`} />
                    <RechartsTooltip 
                      cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', color: '#0f172a' }}
                    />
                    <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="despesas" name="Despesas" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

        {/* Balance Evolution Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Evolução do Saldo</h3>
            <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Últimos 6 meses</option>
              <option>Este ano</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            {MONTHLY_DATA.every(m => m.receitas === 0 && m.despesas === 0 && m.saldo === 0) ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                Dados insuficientes para o gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" axisLine={false} tickLine={false} tickFormatter={(value) => `R$${(value/1000).toFixed(1)}k`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', color: '#0f172a' }}
                    formatter={(value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    name="Saldo" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Budgets and Recent Transactions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budgets */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Orçamentos</h3>
              <button 
                onClick={openAddModal}
                className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Novo
              </button>
            </div>
            <div className="space-y-6">
              {budgetsWithSpent.map((budget) => {
                const percent = Math.min((budget.spent / budget.limit) * 100, 100);
                const isOver = budget.spent > budget.limit;
                return (
                  <div key={budget.id} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-900 flex items-center gap-2">
                        <Target className="w-4 h-4 text-slate-500" />
                        {budget.category}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">
                          <span className={isOver ? 'text-red-500 font-medium' : 'text-slate-900'}>R$ {budget.spent.toFixed(2).replace('.', ',')}</span> / R$ {budget.limit.toFixed(2).replace('.', ',')}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(budget)} className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteBudget(budget.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-red-500' : budget.color}`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    {isOver && <p className="text-xs text-red-500 mt-1">Orçamento excedido!</p>}
                  </div>
                );
              })}
              {budgetsWithSpent.length === 0 && (
                <div className="text-center text-slate-400 py-4">
                  Nenhum orçamento definido.
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Transações Recentes</h3>
              <button onClick={onNavigateToTransactions} className="text-blue-600 text-sm font-medium hover:text-blue-700">Ver todas</button>
            </div>
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center text-slate-400 py-8">Nenhuma transação neste mês.</div>
              ) : (
                filteredTransactions.slice(0, 5).map((tx) => {
                  const isReceita = tx.amount > 0;
                  const categoryStyles = CATEGORY_STYLES[tx.category] || CATEGORY_STYLES['Outros'];
                  const IconComponent = isReceita ? TrendingUp : (CATEGORY_ICONS[tx.category] || CATEGORY_ICONS['Outros']);
                  const colorClass = isReceita ? 'text-emerald-600' : categoryStyles.color;
                  const bgClass = isReceita ? 'bg-emerald-50' : categoryStyles.bg;
                  
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass}`}>
                          <IconComponent className={`w-6 h-6 ${colorClass}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{tx.description}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>{tx.category}</span>
                            <span>•</span>
                            <span>{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`font-semibold ${isReceita ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isReceita ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
        {/* Adjust Balance Modal */}
        {isAdjustBalanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Ajustar Saldo</h3>
                <button onClick={() => setIsAdjustBalanceModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdjustBalance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Saldo real no banco (R$)</label>
                  <input 
                    type="text" 
                    required
                    value={actualBalanceInput}
                    onChange={(e) => setActualBalanceInput(e.target.value)}
                    placeholder="Ex: 1500,00"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    O aplicativo criará uma transação de ajuste automaticamente para que o saldo bata com o valor informado.
                  </p>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-3 transition-colors shadow-sm"
                >
                  Confirmar Ajuste
                </button>
              </form>
            </motion.div>
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 pb-safe z-40">
        <div className="flex justify-around items-center h-16 px-4">
          <button className="flex flex-col items-center justify-center w-full h-full text-blue-600">
            <Wallet className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Início</span>
          </button>
          <button 
            onClick={onNavigateToTransactions}
            className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-700"
          >
            <CreditCard className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Transações</span>
          </button>
          <div className="relative -top-5">
            <button 
              onClick={() => setIsExpenseModalOpen(true)}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-xl text-white border-4 border-slate-50 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          <button 
            onClick={onNavigateToInvestments}
            className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-700"
          >
            <TrendingUp className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Investir</span>
          </button>
          <button 
            onClick={onNavigateToReports}
            className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-700"
          >
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Relatórios</span>
          </button>
        </div>
      </div>

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingBudgetId ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h3>
              <button 
                onClick={() => setIsBudgetModalOpen(false)} 
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <select 
                  value={isAddingCustomCategoryBudget ? 'new_category' : newBudgetCategory}
                  onChange={(e) => {
                    if (e.target.value === 'new_category') {
                      setIsAddingCustomCategoryBudget(true);
                    } else {
                      setIsAddingCustomCategoryBudget(false);
                      setNewBudgetCategory(e.target.value);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  {Object.keys(CATEGORY_COLORS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {customCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new_category">+ Nova Categoria...</option>
                </select>
                {isAddingCustomCategoryBudget && (
                  <input
                    type="text"
                    value={customCategoryInputBudget}
                    onChange={(e) => setCustomCategoryInputBudget(e.target.value)}
                    placeholder="Nome da nova categoria"
                    className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Limite Mensal (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Ex: 500.00"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                {editingBudgetId ? 'Salvar Alterações' : 'Criar Orçamento'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Nova Transação</h3>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input 
                  type="text" 
                  value={newExpenseTitle}
                  onChange={(e) => setNewExpenseTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Ex: Supermercado"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Ex: 150.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <select 
                  value={isAddingCustomCategoryExpense ? 'new_category' : newExpenseCategory}
                  onChange={(e) => {
                    if (e.target.value === 'new_category') {
                      setIsAddingCustomCategoryExpense(true);
                    } else {
                      setIsAddingCustomCategoryExpense(false);
                      setNewExpenseCategory(e.target.value);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm"
                >
                  <option value="Receita">Receita</option>
                  {Object.keys(CATEGORY_ICONS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {customCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new_category">+ Nova Categoria...</option>
                </select>
                {isAddingCustomCategoryExpense && (
                  <input
                    type="text"
                    value={customCategoryInputExpense}
                    onChange={(e) => setCustomCategoryInputExpense(e.target.value)}
                    placeholder="Nome da nova categoria"
                    className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    required
                  />
                )}
              </div>
              <button 
                type="submit"
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                Adicionar Transação
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Insights Modal */}
      {isInsightsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Análise Inteligente</h3>
              </div>
              <button 
                onClick={() => setIsInsightsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {insightsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-500 font-medium animate-pulse">A IA está analisando seus dados...</p>
                </div>
              ) : (
                <div className="prose prose-slate prose-sm sm:prose-base max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-strong:text-slate-900 prose-li:text-slate-600">
                  <Markdown>{insightsText}</Markdown>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
