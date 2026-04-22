/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { BankIntegration } from './components/BankIntegration';
import { ProfileEditor } from './components/ProfileEditor';
import { Investments } from './components/Investments';
import { Transactions } from './components/Transactions';
import { ResetPassword } from './components/ResetPassword';
import { Reports } from './components/Reports';
import { LockScreen } from './components/LockScreen';
import { PremiumPaywall } from './components/PremiumPaywall';
import { Projections } from './components/Projections';
import { supabase } from './lib/supabase';
import { isBiometricsEnabled } from './lib/biometrics';

type AppState = 'login' | 'dashboard' | 'bank-integration' | 'profile' | 'investments' | 'transactions' | 'reset-password' | 'reports' | 'locked' | 'premium' | 'projections';

export default function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [userName, setUserName] = useState(() => {
    try { return localStorage.getItem('adielvibe_username') || 'Usuário'; } 
    catch { return 'Usuário'; }
  });
  const [isPremium, setIsPremium] = useState(() => {
    try { return localStorage.getItem('adielpay_premium') === 'true'; } 
    catch { return false; }
  });
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Check if we are in testing mode without auth
    try {
      const isTestMode = localStorage.getItem('adielpay_test_mode');
      if (isTestMode === 'true') {
        setUserName('Usuário de Teste');
        setAppState('dashboard');
        setIsAuthReady(true);
        return;
      }
    } catch (e) {
      console.error("Local storage error:", e);
    }

    // Check if we are on a password reset URL (Supabase uses #access_token=...&type=recovery)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setAppState('reset-password');
      setIsAuthReady(true);
      return;
    }

    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário');
        if (isBiometricsEnabled()) {
          setAppState('locked');
        } else {
          setAppState('dashboard');
        }
      } else {
        setAppState('login');
      }
      setIsAuthReady(true);
    }).catch(err => {
      console.error("Failed to initialize session:", err);
      setAppState('login');
      setIsAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isTestModeActive = localStorage.getItem('adielpay_test_mode') === 'true';
      if (isTestModeActive) return;

      if (event === 'PASSWORD_RECOVERY') {
        setAppState('reset-password');
        setIsAuthReady(true);
        return;
      }

      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário');
        if (isBiometricsEnabled() && appState === 'login') {
          setAppState('locked');
        } else if (appState === 'login' || appState === 'reset-password') {
          setAppState('dashboard');
        }
      } else {
        if (appState !== 'reset-password') {
          setAppState('login');
        }
      }
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isAuthReady) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">Carregando...</div>;
  }

  return (
    <>
      {appState === 'login' && (
        <Login onLoginSuccess={(name) => {
          const finalName = name || 'Usuário';
          setUserName(finalName);
          localStorage.setItem('adielvibe_username', finalName);
          if (isBiometricsEnabled()) {
            setAppState('locked');
          } else {
            setAppState('dashboard');
          }
        }} />
      )}
      
      {appState === 'locked' && (
        <LockScreen userName={userName} onUnlock={() => setAppState('dashboard')} />
      )}

      {appState === 'dashboard' && (
        <Dashboard 
          userName={userName}
          isPremium={isPremium}
          onNavigateToPremium={() => setAppState('premium')}
          onNavigateToBank={() => setAppState('bank-integration')} 
          onNavigateToProfile={() => setAppState('profile')}
          onNavigateToInvestments={() => setAppState('investments')}
          onNavigateToTransactions={() => setAppState('transactions')}
          onNavigateToReports={() => setAppState('reports')}
          onNavigateToProjections={() => setAppState('projections')}
        />
      )}
      
      {appState === 'bank-integration' && (
        <BankIntegration 
          onBack={() => setAppState('dashboard')} 
          isPremium={isPremium}
          onNavigateToPremium={() => setAppState('premium')}
        />
      )}

      {appState === 'profile' && (
        <ProfileEditor 
          userName={userName}
          onSave={(newName) => {
            setUserName(newName);
            localStorage.setItem('adielvibe_username', newName);
          }}
          onBack={() => setAppState('dashboard')} 
        />
      )}

      {appState === 'investments' && (
        <Investments onBack={() => setAppState('dashboard')} />
      )}

      {appState === 'transactions' && (
        <Transactions onBack={() => setAppState('dashboard')} />
      )}

      {appState === 'reports' && (
        <Reports 
          onBack={() => setAppState('dashboard')} 
          isPremium={isPremium}
          onNavigateToPremium={() => setAppState('premium')}
        />
      )}

      {appState === 'projections' && (
        <Projections onBack={() => setAppState('dashboard')} />
      )}

      {appState === 'premium' && (
        <PremiumPaywall 
          onBack={() => setAppState('dashboard')}
          onSubscribe={() => {
            localStorage.setItem('adielpay_premium', 'true');
            setIsPremium(true);
            setAppState('dashboard');
            alert('Parabéns! Você agora é um usuário Adielpay PRO.');
          }}
        />
      )}

      {appState === 'reset-password' && (
        <ResetPassword onBackToLogin={() => {
          // Remove query params from URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setAppState('login');
        }} />
      )}
    </>
  );
}


