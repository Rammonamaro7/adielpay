import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, User, Lock, Unlock, CheckCircle2, Mail, Wallet, TrendingUp, CircleDollarSign, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type LoginStep = 'credentials' | 'forgot-password' | 'forgot-password-success' | 'register' | 'success';

interface LoginProps {
  onLoginSuccess: (name: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [step, setStep] = useState<LoginStep>('credentials');
  
  // Login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Forgot password state
  const [recoveryEmail, setRecoveryEmail] = useState('');

  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const [loginError, setLoginError] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (identifier && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password: password,
        });
        
        if (error) throw error;
        
        setStep('success');
        setTimeout(() => {
          onLoginSuccess(data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || 'Usuário');
        }, 1500);
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'Failed to fetch') {
          setLoginError('Erro de conexão. Verifique sua internet ou VPN.');
        } else {
          setLoginError(`Falha no login: ${error.message}`);
        }
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // The page will redirect to Google, so we don't need to handle success here
    } catch (error: any) {
      setLoginError('Falha ao fazer login com o Google.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError('');
    if (recoveryEmail) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
          redirectTo: `${window.location.origin}?type=recovery`, // often simpler than hash because Vite routers sometimes eat hashes, but still use origin if they set it up
        });
        if (error) throw error;
        setStep('forgot-password-success');
      } catch (error: any) {
        setForgotPasswordError(`Erro ao enviar email: ${error.message || 'Verifique se o endereço está correto e as permissões de URL configuradas no Supabase.'}`);
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('As senhas não coincidem.');
      return;
    }
    
    if (registerName && registerEmail && registerPassword) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: registerEmail,
          password: registerPassword,
          options: {
            data: {
              full_name: registerName,
            }
          }
        });
        
        if (error) throw error;
        
        setStep('success');
        setTimeout(() => {
          onLoginSuccess(registerName);
        }, 1500);
      } catch (error: any) {
        console.error('Register error:', error);
        if (error.message === 'Failed to fetch') {
          setRegisterError('Erro de conexão. Verifique se as chaves do Supabase (URL e ANON_KEY) foram configuradas corretamente nos Secrets.');
        } else {
          setRegisterError(error.message || 'Erro ao criar conta. O email pode já estar em uso.');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>

      {/* Floating Finance Icons */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[10%] hidden lg:flex items-center justify-center w-16 h-16 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-xl"
      >
        <CircleDollarSign className="w-8 h-8 text-emerald-400" />
      </motion.div>

      <motion.div 
        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[20%] right-[10%] hidden lg:flex items-center justify-center w-16 h-16 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-xl"
      >
        <BarChart3 className="w-8 h-8 text-purple-400" />
      </motion.div>
      
      <motion.div 
        animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }} 
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[25%] right-[15%] hidden lg:flex items-center justify-center w-12 h-12 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-xl"
      >
        <TrendingUp className="w-6 h-6 text-cyan-400" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl p-8 relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-cyan-400 rounded-3xl blur-lg opacity-50"></div>
            <div className="relative w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-cyan-400"></div>
              <Wallet className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-futuristic font-bold text-center text-white mb-2 tracking-wide">AdPay</h1>
        <p className="text-slate-400 text-center mb-8">
          {step === 'credentials' && 'Sua vida financeira no controle'}
          {step === 'register' && 'Crie sua conta e comece agora'}
          {step === 'forgot-password' && 'Recuperação de Senha'}
          {step === 'forgot-password-success' && 'Verifique seu email'}
          {step === 'success' && 'Bem-vindo(a) de volta!'}
        </p>
        
        {step === 'credentials' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="Seu CPF ou Email"
                    required
                  />
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
                <div className="relative">
                  <input 
                    type={showLoginPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-4 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {showLoginPassword ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setStep('forgot-password')}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <button 
                type="submit"
                className="w-full mt-6 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Entrar <ArrowRight className="w-5 h-5" />
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-zinc-900 text-slate-400">Ou</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all"
              >
                Entrar com Google
              </button>

              <div className="text-center mt-6">
                <p className="text-sm text-slate-400">
                  Ainda não tem uma conta?{' '}
                  <button 
                    type="button" 
                    onClick={() => setStep('register')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Cadastre-se
                  </button>
                </p>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'register' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {registerError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center">
                  {registerError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nome Completo</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="Seu nome"
                    required
                  />
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
                <div className="relative">
                  <input 
                    type={showRegisterPassword ? "text" : "password"} 
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-4 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {showRegisterPassword ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar Senha</label>
                <div className="relative">
                  <input 
                    type={showRegisterConfirmPassword ? "text" : "password"} 
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-4 pr-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {showRegisterConfirmPassword ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full mt-6 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Cadastrar <ArrowRight className="w-5 h-5" />
              </button>

              <div className="text-center mt-6">
                <p className="text-sm text-slate-400">
                  Já tem uma conta?{' '}
                  <button 
                    type="button" 
                    onClick={() => setStep('credentials')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Faça login
                  </button>
                </p>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'forgot-password' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              {forgotPasswordError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center">
                  {forgotPasswordError}
                </div>
              )}
              <div className="text-center mb-6">
                <p className="text-sm text-slate-300">
                  Digite seu email cadastrado. Enviaremos as instruções para você redefinir sua senha.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                </div>
              </div>
              
              <div className="space-y-3 mt-6">
                <button 
                  type="submit"
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Enviar Instruções <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center transition-all"
                >
                  Voltar para o Login
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'forgot-password-success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-12 h-12 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Enviado!</h2>
            <p className="text-slate-400 mb-8">
              Verifique a caixa de entrada de <span className="text-white font-medium">{recoveryEmail}</span> para redefinir sua senha.
            </p>
            <button 
              type="button"
              onClick={() => {
                setStep('credentials');
                setRecoveryEmail('');
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center transition-all"
            >
              Voltar para o Login
            </button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Acesso Liberado</h2>
            <p className="text-slate-400">Redirecionando para o painel...</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
