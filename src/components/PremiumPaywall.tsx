import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Landmark, FileText, Crown, Zap } from 'lucide-react';

interface PremiumPaywallProps {
  onBack: () => void;
  onSubscribe: () => void;
}

export function PremiumPaywall({ onBack, onSubscribe }: PremiumPaywallProps) {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');

  const features = [
    { icon: <Sparkles className="w-5 h-5 text-amber-400" />, title: 'Insights com Inteligência Artificial', desc: 'Análises personalizadas dos seus gastos.' },
    { icon: <Landmark className="w-5 h-5 text-amber-400" />, title: 'Integração Bancária (Open Finance)', desc: 'Sincronização automática com seus bancos.' },
    { icon: <FileText className="w-5 h-5 text-amber-400" />, title: 'Relatórios Avançados', desc: 'Exportação em PDF e Excel.' },
    { icon: <Zap className="w-5 h-5 text-amber-400" />, title: 'Categorias Ilimitadas', desc: 'Crie quantas categorias personalizadas quiser.' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="p-4 flex items-center justify-between relative z-10">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900/80 border border-slate-800 hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 px-4 pb-12 max-w-md mx-auto w-full flex flex-col relative z-10">
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20 rotate-12"
          >
            <Crown className="w-10 h-10 text-slate-950 -rotate-12" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-3">Adielpay <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">PRO</span></h1>
          <p className="text-slate-400">Desbloqueie o poder total das suas finanças com recursos exclusivos.</p>
        </div>

        <div className="space-y-4 mb-8">
          {features.map((feat, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="flex items-start gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800"
            >
              <div className="mt-1 bg-slate-950 p-2 rounded-xl border border-slate-800">
                {feat.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">{feat.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-2 mb-8 flex relative">
          <div 
            className={`absolute top-2 bottom-2 w-[calc(50%-8px)] bg-slate-800 rounded-2xl transition-transform duration-300 ${plan === 'yearly' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'}`}
          ></div>
          <button 
            onClick={() => setPlan('monthly')}
            className={`flex-1 py-3 text-sm font-semibold relative z-10 transition-colors ${plan === 'monthly' ? 'text-white' : 'text-slate-400'}`}
          >
            Mensal
          </button>
          <button 
            onClick={() => setPlan('yearly')}
            className={`flex-1 py-3 text-sm font-semibold relative z-10 transition-colors flex items-center justify-center gap-2 ${plan === 'yearly' ? 'text-white' : 'text-slate-400'}`}
          >
            Anual <span className="bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full">-40%</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="text-4xl font-bold mb-2">
            {plan === 'yearly' ? 'R$ 12,49' : 'R$ 19,90'}
            <span className="text-lg text-slate-500 font-normal">/mês</span>
          </div>
          <p className="text-sm text-slate-500">
            {plan === 'yearly' ? 'Cobrado R$ 149,90 anualmente.' : 'Cancele quando quiser.'}
          </p>
        </div>

        <button 
          onClick={onSubscribe}
          className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold text-lg rounded-2xl px-4 py-4 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-500/20"
        >
          Assinar Agora
        </button>
      </main>
    </div>
  );
}
