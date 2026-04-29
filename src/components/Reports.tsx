import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Download, FileText, PieChart as PieChartIcon, BarChart3, FileSpreadsheet } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportsProps {
  onBack: () => void;
  isPremium: boolean;
  onNavigateToPremium: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#22d3ee', // cyan-400
  'Transporte': '#f472b6', // pink-400
  'Lazer': '#fbbf24', // amber-400
  'Moradia': '#c084fc', // purple-400
  'Contas': '#34d399', // emerald-400
  'Outros': '#a1a1aa'  // zinc-400
};

export function Reports({ onBack, isPremium, onNavigateToPremium }: ReportsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchTransactions = async (uid?: string) => {
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    if (isTestMode) {
      const mockTxs = JSON.parse(localStorage.getItem('adielpay_mock_txs') || '[]');
      const normalizedMockTxs = mockTxs.map((tx: any) => ({
        ...tx,
        amount: tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount)
      }));
      setTransactions(normalizedMockTxs);
      return;
    }

    if (!uid) return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false });
    if (!error && data) {
      const normalizedData = data.map(tx => ({
        ...tx,
        amount: tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount)
      }));
      setTransactions(normalizedData);
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
        fetchTransactions(session.user.id);
      }
    });
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (!tx.date) return false;
      const txMonth = tx.date.substring(0, 7);
      return txMonth === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  const expenseDataMap: Record<string, number> = {};
  filteredTransactions.forEach(tx => {
    if (tx.amount < 0) {
      expenseDataMap[tx.category] = Math.round(((expenseDataMap[tx.category] || 0) + Math.abs(tx.amount)) * 100) / 100;
    }
  });

  const EXPENSE_DATA = Object.entries(expenseDataMap)
    .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Outros'] }))
    .sort((a, b) => b.value - a.value);

  const totalIncome = filteredTransactions.filter(tx => tx.amount > 0).reduce((acc, tx) => acc + Math.round(tx.amount * 100), 0) / 100;
  const totalExpense = filteredTransactions.filter(tx => tx.amount < 0).reduce((acc, tx) => acc + Math.round(Math.abs(tx.amount) * 100), 0) / 100;
  const balance = totalIncome - totalExpense;

  const exportToPDF = () => {
    if (!isPremium) {
      onNavigateToPremium();
      return;
    }

    if (filteredTransactions.length === 0) {
      alert('Nenhuma transação neste mês para exportar.');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(`Relatório Financeiro - ${selectedMonth}`, 14, 22);
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Receitas: R$ ${totalIncome.toFixed(2).replace('.', ',')}`, 14, 32);
    doc.text(`Despesas: R$ ${totalExpense.toFixed(2).replace('.', ',')}`, 14, 40);
    doc.text(`Balanço: R$ ${balance.toFixed(2).replace('.', ',')}`, 14, 48);

    // Table
    const tableColumn = ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)"];
    const tableRows = filteredTransactions.map(tx => {
      const date = new Date(tx.date).toLocaleDateString('pt-BR');
      const type = tx.amount > 0 ? 'Receita' : 'Despesa';
      const amount = Math.abs(tx.amount).toFixed(2).replace('.', ',');
      return [date, tx.description, tx.category, type, amount];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] }, // cyan-500
    });

    doc.save(`relatorio_adielpay_${selectedMonth}.pdf`);
  };

  const exportToExcel = () => {
    if (!isPremium) {
      onNavigateToPremium();
      return;
    }

    if (filteredTransactions.length === 0) {
      alert('Nenhuma transação neste mês para exportar.');
      return;
    }

    const dataToExport = filteredTransactions.map(tx => ({
      'Data': new Date(tx.date).toLocaleDateString('pt-BR'),
      'Descrição': tx.description,
      'Categoria': tx.category,
      'Tipo': tx.amount > 0 ? 'Receita' : 'Despesa',
      'Valor (R$)': Math.abs(tx.amount)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transações");
    
    // Generate buffer and save
    XLSX.writeFile(workbook, `relatorio_adielpay_${selectedMonth}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-lg">Relatórios</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              title="Exportar para PDF"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              title="Exportar para Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left">
          <p className="text-amber-400 text-xs sm:text-sm font-medium leading-relaxed">
            <strong className="block mb-1">Aviso sobre Exportações:</strong>
            Os valores exportados podem apresentar variações de alguns décimos ou centavos em 
            relação ao seu banco devido a arredondamentos numéricos aplicados na importação/exportação CSV/OFX.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Resumo Financeiro</h2>
            <p className="text-slate-400 text-sm mt-1">Análise detalhada dos seus gastos e receitas.</p>
          </div>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">Receitas do Mês</p>
            <p className="text-2xl font-bold text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">Despesas do Mês</p>
            <p className="text-2xl font-bold text-red-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">Balanço do Mês</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-lg">Despesas por Categoria</h3>
            </div>
            
            {EXPENSE_DATA.length > 0 ? (
              <div className="h-64">
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
                    >
                      {EXPENSE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                Nenhuma despesa neste mês.
              </div>
            )}
          </motion.div>

          {/* Bar Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-lg">Maiores Gastos</h3>
            </div>
            
            {EXPENSE_DATA.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={EXPENSE_DATA.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
                    <RechartsTooltip 
                      formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#f8fafc' }}
                      cursor={{ fill: '#1e293b' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {EXPENSE_DATA.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                Nenhuma despesa neste mês.
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
