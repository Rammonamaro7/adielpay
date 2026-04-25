import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Target, TrendingDown, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface ProjectionsProps {
  onBack: () => void;
}

export function Projections({ onBack }: ProjectionsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);

  useEffect(() => {
    const fetchTransactions = async () => {
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

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('date', { ascending: true });
        if (data) {
          const normalizedData = data.map(tx => ({
            ...tx,
            amount: tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount)
          }));
          setTransactions(normalizedData);
        }
      }
    };
    fetchTransactions();
  }, []);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Calculate total days in current month and current day
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  const currentMonthTxs = useMemo(() => {
    return transactions.filter(tx => tx.date && tx.date.startsWith(currentMonthStr));
  }, [transactions, currentMonthStr]);

  const { totalIncome, totalExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    currentMonthTxs.forEach(tx => {
      if (tx.amount > 0) inc += tx.amount;
      else if (tx.amount < 0) exp += Math.abs(tx.amount);
    });
    return { totalIncome: inc, totalExpense: exp };
  }, [currentMonthTxs]);

  // Data mapping for projections chart
  const chartData = useMemo(() => {
    const data = [];
    let accumulatedExpense = 0;
    
    // Calculate average daily rate
    const dailyAverage = currentDay > 0 ? totalExpense / currentDay : 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
      
      // Calculate actual mapped sum for the day
      const dayTxs = currentMonthTxs.filter(tx => tx.date === dateStr && tx.amount < 0);
      const daySpend = dayTxs.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      if (day <= currentDay) {
        accumulatedExpense += daySpend;
      }
      
      // Projected expenses continuous based on daily average
      const projectedTotal = day <= currentDay ? accumulatedExpense : accumulatedExpense + (dailyAverage * (day - currentDay));

      data.push({
        day: String(day),
        gasto_real: day <= currentDay ? accumulatedExpense : undefined,
        projecao: projectedTotal,
      });
    }
    return data;
  }, [currentMonthTxs, currentDay, daysInMonth, currentMonthStr, totalExpense]);

  const dailyAverage = currentDay > 0 ? (totalExpense / currentDay) : 0;
  const projectedMonthlyExpense = dailyAverage * daysInMonth;
  const remainingBudget = totalIncome > 0 ? (totalIncome - totalExpense) : 0;
  
  // Rules for AI Warning
  const isOverspending = projectedMonthlyExpense > totalIncome && totalIncome > 0;
  const safeDailyRemaining = (totalIncome - totalExpense) / (daysInMonth - currentDay);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-500" />
            Metas & Projeções
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6">
        
        {/* Warning / Status Card */}
        {totalIncome > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-3xl border shadow-sm ${isOverspending ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}
          >
            <div className="flex gap-4">
              <div className={`p-3 rounded-2xl ${isOverspending ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'} shrink-0 h-min`}>
                {isOverspending ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isOverspending ? 'text-red-900' : 'text-emerald-900'}`}>
                  {isOverspending ? 'Atenção ao Ritmo de Gastos!' : 'Você está no caminho certo!'}
                </h2>
                <p className={`mt-1 ${isOverspending ? 'text-red-700' : 'text-emerald-700'}`}>
                  {isOverspending ? (
                    `Se você continuar gastando uma média de R$ ${dailyAverage.toFixed(2).replace('.', ',')} por dia, sua fatura/despesa final (R$ ${projectedMonthlyExpense.toFixed(2).replace('.', ',')}) vai ultrapassar sua renda de R$ ${totalIncome.toFixed(2).replace('.', ',')}.`
                  ) : (
                    `Mantendo essa média diária (R$ ${dailyAverage.toFixed(2).replace('.', ',')}), suas despesas finais serão em torno de R$ ${projectedMonthlyExpense.toFixed(2).replace('.', ',')}, sobrando receita no fim do mês!`
                  )}
                </p>
                {isOverspending && safeDailyRemaining > 0 && (
                  <div className="mt-4 p-4 bg-white/60 rounded-xl border border-red-100 text-red-800 text-sm font-medium">
                    Sugestão Mágica: Para fechar o mês no azul, tente gastar no máximo R$ {safeDailyRemaining.toFixed(2).replace('.', ',')} por dia a partir de hoje.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-6 rounded-3xl border border-blue-200 bg-blue-50 flex gap-4 text-blue-800">
            <Info className="w-6 h-6 shrink-0" />
            <p>Adicione alguma receita ou saldo positivo neste mês para que o sistema consiga calcular suas projeções de limite.</p>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-1">Média Gasta por Dia (Atual)</p>
            <p className="text-3xl font-bold text-slate-900">
              R$ {dailyAverage.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-1">Projeção Final do Mês</p>
            <p className="text-3xl font-bold text-slate-900">
              R$ {projectedMonthlyExpense.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-1">Orçamento / Receitas (Total)</p>
            <p className="text-3xl font-bold text-slate-900">
              R$ {totalIncome.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>

        {/* Chart View */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-900">Ritmo de Despesas vs Receita (Mês Atual)</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `R$${val}`} />
                <RechartsTooltip 
                  formatter={(value: number, name: string) => [`R$ ${value.toFixed(2).replace('.', ',')}`, name === 'gasto_real' ? 'Gasto Real' : 'Projeção (Estimativa)']}
                  labelFormatter={(label) => `Dia ${label}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                
                {/* Horizontal line for Total Income Limit */}
                {totalIncome > 0 && (
                  <ReferenceLine y={totalIncome} label={{ position: 'top', value: 'Limite Mensal (Receitas)', fill: '#10b981', fontSize: 12 }} stroke="#10b981" strokeDasharray="3 3" />
                )}

                <Area 
                  type="monotone" 
                  dataKey="projecao" 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5" 
                  fillOpacity={1} 
                  fill="url(#colorProjecao)" 
                  name="Projeção"
                />
                <Area 
                  type="monotone" 
                  dataKey="gasto_real" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorGasto)" 
                  name="Gasto Real"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-xs text-slate-500 italic text-center">
            O gráfico mostra o acúmulo das suas despesas dia a dia. A linha pontilhada amarela estima o restante do mês com base na sua média de gastos atuais.
          </div>
        </div>
      </main>
    </div>
  );
}
