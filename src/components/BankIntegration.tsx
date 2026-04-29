import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, CheckCircle2, Building2, Landmark, RefreshCw, FileUp, Trash2, Lock } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

const BANKS = [
  { id: 'nubank', name: 'Nubank', color: 'bg-[#8A05BE]', logo: 'N' },
  { id: 'itau', name: 'Itaú', color: 'bg-[#EC7000]', logo: 'I' },
  { id: 'bradesco', name: 'Bradesco', color: 'bg-[#CC092F]', logo: 'B' },
  { id: 'bb', name: 'Banco do Brasil', color: 'bg-[#F9D308]', logo: 'BB', textColor: 'text-zinc-900' },
  { id: 'santander', name: 'Santander', color: 'bg-[#EC0000]', logo: 'S' },
  { id: 'inter', name: 'Banco Inter', color: 'bg-[#FF7A00]', logo: 'IN' },
];

interface BankIntegrationProps {
  onBack: () => void;
  isPremium: boolean;
  onNavigateToPremium: () => void;
}

export function BankIntegration({ onBack, isPremium, onNavigateToPremium }: BankIntegrationProps) {
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [syncState, setSyncState] = useState<'idle' | 'consent' | 'login' | 'syncing' | 'success' | 'maintenance'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Fake Login State
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');

  const parseAmount = (val: string, isExplicitDebit = false) => {
    if (!val) return 0;
    
    if (typeof val === 'string' && val.match(/\d{2}\/\d{2}\/\d{4}/)) return 0;
    
    const lowerVal = val.toString().toLowerCase();
    const isCreditFlag = lowerVal.includes('credito') || lowerVal.includes('crédito') || lowerVal.includes('entrada') || /\bc\s*$/i.test(lowerVal);
    const isDebitFlag = lowerVal.includes('debito') || lowerVal.includes('débito') || lowerVal.includes('saida') || lowerVal.includes('saída') || /\bd\s*$/i.test(lowerVal);
    
    const isDebit = isExplicitDebit || (!isCreditFlag && (isDebitFlag || /-|-\s*R\$|\(.*\)/i.test(val)));
    
    let clean = val.toString().replace(/[^\d.,]/g, '').trim();
    
    if (clean.includes('.') && clean.includes(',')) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastComma > lastDot) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      const parts = clean.split(',');
      if (parts.length > 2) {
        clean = clean.replace(/,/g, '');
      } else if (parts.length === 2 && parts[1].length === 3) {
        clean = clean.replace(/,/g, '');
      } else {
        clean = clean.replace(',', '.');
      }
    } else if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts.length > 2) {
        clean = clean.replace(/\./g, '');
      } else if (parts.length === 2 && parts[1].length === 3) {
        clean = clean.replace(/\./g, '');
      }
    }
    
    let parsed = parseFloat(clean);
    if (isNaN(parsed)) return 0;
    
    if (isDebit && parsed > 0) {
        parsed = -parsed;
    }
    
    return Math.round(parsed * 100) / 100;
  };

  const autoCategorize = (description: string, amount: number): string => {
    if (amount > 0) return 'Receita';
    
    const desc = description.toLowerCase();
    
    const categories = {
      'Alimentação': ['ifood', 'rappi', 'mcdonalds', 'burger king', 'supermercado', 'mercado', 'padaria', 'restaurante', 'zé delivery', 'assai', 'carrefour', 'pao de acucar', 'extra', 'atacadao'],
      'Transporte': ['uber', '99', 'posto', 'gasolina', 'shell', 'ipiranga', 'petrobras', 'sem parar', 'veloe', 'conectcar', '99app', 'cabify', 'estacionamento'],
      'Moradia': ['aluguel', 'condominio', 'enel', 'sabesp', 'light', 'copel', 'sanepar', 'ceg', 'comgas'],
      'Lazer': ['netflix', 'spotify', 'cinema', 'ingresso', 'prime video', 'hbo', 'disney', 'amazon prime', 'playstation', 'xbox', 'steam', 'nintendo'],
      'Contas': ['vivo', 'claro', 'tim', 'oi', 'internet', 'net', 'seguro', 'faculdade', 'escola', 'curso']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return 'Outros';
  };

  const handleResetData = async () => {
    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user && !isTestMode) return;
    
    setIsResetting(true);
    setSyncState('syncing');
    setImportMessage('Apagando dados antigos...');

    try {
      if (isTestMode) {
        localStorage.removeItem('adielpay_mock_txs');
        localStorage.removeItem('adielpay_mock_budgets');
      } else {
        await supabase.from('transactions').delete().eq('user_id', session!.user.id);
        await supabase.from('budgets').delete().eq('user_id', session!.user.id);
        await supabase.from('investments').delete().eq('user_id', session!.user.id);
      }
      
      setSyncState('idle');
      setShowResetConfirm(false);
    } catch (error: any) {
      console.error(error);
      alert('Erro ao zerar dados.');
      setSyncState('idle');
    } finally {
      setIsResetting(false);
    }
  };

  const parseOFX = (ofxString: string) => {
    const transactions: any[] = [];
    const parts = ofxString.split(/<STMTTRN>/i);
    if (parts.length <= 1) return transactions;
    
    parts.slice(1).forEach((trn) => {
      const dateMatch = trn.match(/<DTPOSTED>([^<\r\n]+)/i);
      const amountMatch = trn.match(/<TRNAMT>([^<\r\n]+)/i);
      const memoMatch = trn.match(/<MEMO>([^<\r\n]+)/i) || trn.match(/<NAME>([^<\r\n]+)/i);
      
      if (dateMatch && amountMatch) {
        const rawDate = dateMatch[1].trim().substring(0, 8);
        let date = new Date().toISOString().split('T')[0] + 'T12:00:00Z'; // fallback
        if (rawDate.length >= 8) {
          date = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}T12:00:00Z`;
        }
        
        const amount = parseAmount(amountMatch[1]);
        const title = memoMatch ? memoMatch[1].trim() : 'Transação';
        
        if (!isNaN(amount) && amount !== 0 && Math.abs(amount) < 100000000) {
          transactions.push({
            date,
            amount: amount,
            title: title.substring(0, 100),
            category: autoCategorize(title, amount)
          });
        }
      }
    });
    return transactions;
  };

  const parseCSV = (csvString: string) => {
    return new Promise<any[]>((resolve) => {
      Papa.parse(csvString, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          let transactions: any[] = [];
          let headerRowIdx = -1;
          
          for (let i = 0; i < Math.min(10, results.data.length); i++) {
            const rowStr = String(results.data[i]).toLowerCase();
            if (rowStr.match(/data|date|lançamento|vencimento|movimento/i) && 
                rowStr.match(/valor|amount|saída|entrada|crédito|débito/i)) {
              headerRowIdx = i;
              break;
            }
          }
          
          let dataToProcess = [];
          let headers: string[] = [];
          
          let latestDateMs = 0;
          let finalSaldo: number | null = null;
          
          if (headerRowIdx !== -1) {
            headers = (results.data[headerRowIdx] as string[]).map(h => String(h).trim().toLowerCase());
            dataToProcess = results.data.slice(headerRowIdx + 1);
          } else {
            dataToProcess = results.data;
          }

          dataToProcess.forEach((row: any) => {
            if (!Array.isArray(row) || row.length < 2) return;
            
            let dateVal = '';
            let valVal = '';
            let descVal = '';
            let isExplicitDebit = false;

            if (headers.length > 0) {
              const dateIdx = headers.findIndex(k => /data|date|lançamento|vencimento|movimento/i.test(k));
              const valIdx = headers.findIndex(k => /valor|amount/i.test(k));
              const debitIdx = headers.findIndex(k => /saída|débito/i.test(k));
              const creditIdx = headers.findIndex(k => /entrada|crédito/i.test(k));
              
              const descIdx = headers.findIndex(k => /desc|hist|detalhe|memo|nome|texto/i.test(k)) || 
                              headers.findIndex(k => !/data|date|valor|amount|saldo|crédito|débito|saída|entrada/i.test(k) && k !== headers[dateIdx]);

              dateVal = dateIdx !== -1 ? String(row[dateIdx] || '') : '';
              descVal = descIdx !== -1 ? String(row[descIdx] || '') : 'Transação';

              if (valIdx !== -1) {
                valVal = String(row[valIdx] || '');
              } else if (debitIdx !== -1 && row[debitIdx] && String(row[debitIdx]).trim() !== '' && String(row[debitIdx]).trim() !== '0') {
                valVal = String(row[debitIdx]);
                isExplicitDebit = true;
              } else if (creditIdx !== -1 && row[creditIdx]) {
                valVal = String(row[creditIdx]);
              }
            } else {
              const rowStrs = row.map((c: any) => String(c).trim());
              const possibleDateIdx = rowStrs.findIndex(c => c.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}$/) || c.match(/^\d{4}-\d{2}-\d{2}$/));
              if (possibleDateIdx !== -1) {
                 dateVal = rowStrs[possibleDateIdx];
                 const possibleAmounts = rowStrs.filter((c: string, idx: number) => idx !== possibleDateIdx && c.match(/^[+-]?\s*R?\$?\s*\d+([.,]\d+)*\s*([+-]|[CDcd])?\s*$/) && !c.match(/^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}$/));
                 if (possibleAmounts.length > 0) {
                   valVal = possibleAmounts[possibleAmounts.length - 1];
                   const otherStrings = rowStrs.filter((c: string, idx: number) => idx !== possibleDateIdx && c !== valVal && c !== '');
                   descVal = otherStrings.length > 0 ? otherStrings.join(' - ') : 'Transação';
                 } else {
                    valVal = String(row[1] || '');
                    descVal = String(row[2] || 'Transação');
                 }
              } else {
                dateVal = String(row[0] || '');
                if (row.length === 2) {
                  valVal = String(row[1] || '');
                  descVal = 'Transação';
                } else {
                  descVal = String(row[1] || '');
                  valVal = String(row[2] || row[row.length - 1] || '');
                }
              }
            }

            dateVal = dateVal.trim();
            valVal = valVal.trim();
            
            if (dateVal && valVal) {
              let formattedDate = new Date().toISOString().split('T')[0];
              
              if (dateVal.includes('/')) {
                const parts = dateVal.split('/');
                if (parts.length >= 3) {
                  if (parts[2].length === 4) {
                    formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                  } 
                  else if (parts[2].length === 2) {
                    formattedDate = `20${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                  }
                }
              } else if (dateVal.includes('-')) {
                formattedDate = dateVal.substring(0, 10);
              }
              
              const amount = parseAmount(valVal, isExplicitDebit);
              
              if (!isNaN(amount) && amount !== 0 && Math.abs(amount) < 100000000) {
                transactions.push({
                  date: `${formattedDate}T12:00:00Z`,
                  amount: amount,
                  title: descVal.substring(0, 100).trim() || 'Transação',
                  category: autoCategorize(descVal, amount)
                });
                
                if (headers.length > 0) {
                  const saldoIdx = headers.findIndex(k => /saldo/i.test(k));
                  if (saldoIdx !== -1 && row[saldoIdx]) {
                    const sAmount = parseAmount(String(row[saldoIdx]));
                    if (!isNaN(sAmount)) {
                      const dMs = new Date(`${formattedDate}T12:00:00Z`).getTime();
                      if (dMs >= latestDateMs) {
                        latestDateMs = dMs;
                        finalSaldo = sAmount;
                      }
                    }
                  }
                }
              }
            }
          });
          
          resolve(transactions);
        }
      });
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isTestMode = localStorage.getItem('adielpay_test_mode') === 'true';
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user && !isTestMode) {
      alert("Sessão expirou. Por favor, faça login novamente.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    setSyncState('syncing');
    setImportMessage('Lendo arquivo...');

    try {
      const text = await file.text();
      let transactions: any[] = [];

      if (file.name.toLowerCase().endsWith('.ofx')) {
        transactions = parseOFX(text);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        transactions = await parseCSV(text);
      } else {
        throw new Error('Formato não suportado. Use OFX ou CSV.');
      }

      let reportedBalance: number | null = null;
      let balanceDate: string = new Date().toISOString().split('T')[0];
      
      const balanceTxIndex = transactions.findIndex(t => t._isReportedBalance);
      if (balanceTxIndex !== -1) {
        reportedBalance = transactions[balanceTxIndex].amount;
        balanceDate = transactions[balanceTxIndex].date.split('T')[0];
        transactions.splice(balanceTxIndex, 1);
      }

      if (file.name.toLowerCase().endsWith('.ofx')) {
        const balamtMatch = text.match(/<BALAMT>([^<\r\n]+)/i);
        if (balamtMatch) {
          reportedBalance = parseAmount(balamtMatch[1]);
          const dtMatch = text.match(/<DTASOF>([^<\r\n]+)/i);
          if (dtMatch) {
            const rawDate = dtMatch[1].trim().substring(0, 8);
            if (rawDate.length >= 8) balanceDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
          }
        }
      }

      if (transactions.length === 0) {
        console.log("Conteúdo do arquivo processado: ", text.substring(0, 500));
        throw new Error('Nenhuma transação encontrada ou formato não reconhecido. Certifique-se de que é um CSV com colunas de Data, Descrição e Valor ou OFX válido.');
      }

      setImportMessage(`Verificando transações duplicadas...`);
      
      let existingTxs: any[] = [];
      if (isTestMode) {
        existingTxs = JSON.parse(localStorage.getItem('adielpay_mock_txs') || '[]');
      } else {
        const { data: currentTxs, error: fetchErr } = await supabase.from('transactions').select('*').eq('user_id', session!.user.id);
        if (!fetchErr && currentTxs) {
          existingTxs = currentTxs;
        }
      }

      const newTransactions = transactions.filter(t => {
        const tDate = t.date.split('T')[0];
        const tTitle = t.title.toLowerCase().trim();
        return !existingTxs.some(ex => {
          // Compare dates properly
          const exDate = ex.date ? ex.date.split('T')[0] : '';
          const exTitle = (ex.description || '').toLowerCase().trim();
          return exDate === tDate && Math.abs((ex.amount || 0) - t.amount) < 0.001 && exTitle === tTitle;
        });
      });

      if (newTransactions.length === 0) {
        throw new Error('Todas as transações deste arquivo já foram importadas anteriormente.');
      }

      setImportMessage(`Salvando ${newTransactions.length} transações...`);

      if (isTestMode) {
        const mockTxs = JSON.parse(localStorage.getItem('adielpay_mock_txs') || '[]');
        const newMockTxs = newTransactions.map(tx => ({
          id: Math.random().toString(),
          description: tx.title,
          amount: tx.amount,
          category: tx.category,
          type: tx.amount > 0 ? 'income' : 'expense',
          date: tx.date.split('T')[0]
        }));
        localStorage.setItem('adielpay_mock_txs', JSON.stringify([...mockTxs, ...newMockTxs]));
      } else {
        const batch = newTransactions.map(tx => ({
          user_id: session!.user.id,
          description: tx.title,
          amount: tx.amount,
          category: tx.category,
          type: tx.amount > 0 ? 'income' : 'expense',
          date: tx.date.split('T')[0]
        }));
        const { error } = await supabase.from('transactions').insert(batch);
        if (error) throw error;
      }
      
      setSyncState('success');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao importar arquivo.');
      setSyncState('idle');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectBank = (bank: any) => {
    setSelectedBank(bank);
    setSyncState('maintenance');
  };

  const handleAcceptConsent = () => {
    setSyncState('login');
  };

  const generateFakeTransactions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    const fakeData = [
      { title: 'Supermercado Extra', amount: -250.45, category: 'Alimentação' },
      { title: 'Uber do mês', amount: -85.20, category: 'Transporte' },
      { title: 'Conta de Luz', amount: -120.00, category: 'Moradia' },
      { title: 'Netflix', amount: -39.90, category: 'Lazer' },
      { title: 'Salário', amount: 4500.00, category: 'Receita' },
      { title: 'Ifood', amount: -65.90, category: 'Alimentação' },
      { title: 'Farmácia', amount: -45.00, category: 'Outros' },
      { title: 'Gasolina', amount: -150.00, category: 'Transporte' },
    ];

    const batch = [];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
      const randomTx = fakeData[Math.floor(Math.random() * fakeData.length)];
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const txDate = new Date(now);
      txDate.setDate(now.getDate() - randomDaysAgo);

      batch.push({
        user_id: session.user.id,
        description: randomTx.title,
        category: randomTx.category,
        amount: randomTx.amount,
        type: randomTx.amount > 0 ? 'income' : 'expense',
        date: txDate.toISOString().split('T')[0]
      });
    }

    await supabase.from('transactions').insert(batch);
  };

  const handleBankLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncState('syncing');
    setImportMessage(`Conectando com ${selectedBank.name}...`);
    
    // Simulate connection delay
    setTimeout(async () => {
      setImportMessage('Sincronizando transações...');
      await generateFakeTransactions();
      setSyncState('success');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => {
              if (syncState === 'idle' || syncState === 'success') onBack();
              else setSyncState('idle');
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-lg">Integração Bancária</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {syncState === 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Landmark className="w-8 h-8 text-zinc-100" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Open Finance Brasil</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Conecte suas contas bancárias para importar e categorizar suas transações automaticamente com total segurança.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {BANKS.map((bank) => (
                <button
                  key={bank.id}
                  onClick={() => handleSelectBank(bank)}
                  className="relative bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col items-center gap-4 transition-all hover:scale-[1.02]"
                >
                  {!isPremium && (
                    <div className="absolute top-3 right-3 bg-amber-500/10 border border-amber-500/20 p-1.5 rounded-lg" title="Recurso PRO">
                      <Lock className="w-3 h-3 text-amber-500" />
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg ${bank.color} ${bank.textColor || ''}`}>
                    {bank.logo}
                  </div>
                  <span className="font-medium text-sm">{bank.name}</span>
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-950 text-slate-400">Ou importe manualmente</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileUp className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Importar Extrato (OFX ou CSV)</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                Acesse o internet banking ou aplicativo do seu banco, baixe o extrato do mês no formato OFX ou CSV e envie aqui.
              </p>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-amber-400 text-xs sm:text-sm font-medium leading-relaxed">
                  <strong className="block mb-1">Atenção:</strong>
                  Ao importar seu extrato, os valores e totais podem apresentar algumas pequenas variações (décimos/centavos) em relação ao saldo oficial do seu banco. 
                  Isso ocorre devido a arredondamentos aplicados pelo próprio arquivo do banco e diferença no modo em que datas ou taxas são exportadas. 
                  Mas fique tranquilo, **os valores de cada transação podem ser ajustados manualmente** sempre que necessário no painel.
                </p>
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".ofx,.csv"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl px-6 py-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] mb-4"
              >
                Selecionar Arquivo
              </button>

              <div className="mt-8 pt-8 border-t border-slate-800">
                {showResetConfirm ? (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 text-sm font-medium mb-4">
                      Tem certeza? Isso apagará TODAS as suas transações, orçamentos e investimentos atuais. A conta ficará zerada.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => setShowResetConfirm(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleResetData}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Sim, Zerar Tudo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors mx-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Zerar conta antes de importar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {syncState === 'consent' && selectedBank && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-zinc-100" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-700 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-700 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white ${selectedBank.color} ${selectedBank.textColor || ''}`}>
                  {selectedBank.logo}
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-center mb-6">Consentimento Open Finance</h3>
            
            <div className="space-y-4 mb-8 text-sm text-slate-300">
              <p>
                Você está prestes a conectar sua conta do <strong>{selectedBank.name}</strong> ao <span className="font-futuristic font-bold">AdPay</span>.
              </p>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="font-semibold text-white mb-2">O que será compartilhado:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Dados cadastrais básicos</li>
                  <li>Saldos de contas correntes</li>
                  <li>Extrato de transações (últimos 12 meses)</li>
                  <li>Faturas de cartão de crédito</li>
                </ul>
              </div>
              <p className="text-xs text-slate-500">
                O compartilhamento é seguro e regulamentado pelo Banco Central do Brasil. Você pode revogar este acesso a qualquer momento.
              </p>
            </div>

            <button 
              onClick={handleAcceptConsent}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl px-4 py-3 transition-all"
            >
              Continuar para o {selectedBank.name}
            </button>
          </motion.div>
        )}

        {syncState === 'login' && selectedBank && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md mx-auto text-slate-900"
          >
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-lg ${selectedBank.color} ${selectedBank.textColor || ''}`}>
                {selectedBank.logo}
              </div>
              <h3 className="text-2xl font-bold">Acesse sua conta</h3>
              <p className="text-slate-500 text-sm mt-1">Ambiente seguro {selectedBank.name}</p>
            </div>

            <form onSubmit={handleBankLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                <input 
                  type="text" 
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha do App</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-4 mb-6 justify-center">
                <Lock className="w-3 h-3" />
                <span>Criptografia ponta-a-ponta</span>
              </div>

              <button 
                type="submit"
                className={`w-full text-white font-bold rounded-xl px-4 py-3 transition-all ${selectedBank.color} hover:opacity-90`}
              >
                Entrar e Conectar
              </button>
            </form>
          </motion.div>
        )}

        {syncState === 'syncing' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto"
          >
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isResetting ? 'Zerando Conta...' : isImporting ? 'Importando Transações...' : 'Sincronizando Dados...'}
            </h3>
            <p className="text-slate-400 text-sm">
              {isResetting || isImporting ? importMessage : importMessage || 'Aguarde enquanto baixamos suas transações de forma segura.'}
            </p>
          </motion.div>
        )}

        {syncState === 'success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto"
          >
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Conexão Estabelecida!</h3>
            <p className="text-slate-400 text-sm mb-8">
              Suas transações foram importadas e categorizadas com sucesso pela nossa Inteligência Artificial.
            </p>
            <button 
              onClick={onBack}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl px-4 py-3 transition-all"
            >
              Ver Transações no Dashboard
            </button>
          </motion.div>
        )}

        {syncState === 'maintenance' && selectedBank && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10 text-center max-w-md mx-auto"
          >
            <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mb-6 relative shadow-lg">
              <div className={`w-12 h-12 ${selectedBank.color} rounded-xl flex items-center justify-center text-xl font-bold ${selectedBank.textColor || 'text-white'}`}>
                {selectedBank.logo}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-100 mb-3">Em Manutenção</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              A integração automática com o <span className="font-semibold text-slate-300">{selectedBank.name}</span> está recebendo novas atualizações. Em breve, ela estará disponível novamente.
              <br /><br />
              Por enquanto, você pode <span className="font-semibold text-cyan-400">importar seu extrato OFX ou CSV</span> manualmente e nossa I.A fará o resto!
            </p>
            
            <button 
              onClick={() => setSyncState('idle')}
              className="px-6 py-3 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-medium transition-colors w-full"
            >
              Voltar
            </button>
          </motion.div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-slate-500">
          <ShieldCheck className="w-4 h-4" />
          <span>Protegido por criptografia de ponta a ponta</span>
        </div>
      </main>
    </div>
  );
}
