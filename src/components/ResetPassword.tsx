import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, Lock, Unlock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResetPasswordProps {
  onBackToLogin: () => void;
}

export function ResetPassword({ onBackToLogin }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Supabase handles the token verification automatically when redirected with #access_token
    // We just need to check if we have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsVerifying(false);
      } else {
        setError('Sessão de recuperação inválida ou expirada.');
        setIsVerifying(false);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        onBackToLogin();
      }, 3000);
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setError(`Ocorreu um erro: ${err.message || 'Tente novamente.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-zinc-800 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-zinc-700 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-zinc-800 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-4000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl p-8 relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-8 h-8 text-zinc-100" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-white mb-2">Adielpay</h1>
        
        {isVerifying ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Verificando link de segurança...</p>
          </div>
        ) : success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Senha Redefinida!</h2>
            <p className="text-slate-400 mb-8">Sua senha foi alterada com sucesso.</p>
            <button 
              onClick={onBackToLogin}
              className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-xl px-4 py-3 flex items-center justify-center transition-all"
            >
              Ir para o Login
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <p className="text-slate-400 text-center mb-8">Crie uma nova senha</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nova Senha</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-4 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar Nova Senha</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-4 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {showConfirmPassword ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 mt-6">
                <button 
                  type="submit"
                  disabled={!!error}
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar Nova Senha <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={onBackToLogin}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center transition-all"
                >
                  Voltar para o Login
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
