import React, { useEffect, useState } from 'react';
import { Fingerprint, Lock } from 'lucide-react';
import { authenticateBiometrics } from '../lib/biometrics';
import { supabase } from '../lib/supabase';

interface LockScreenProps {
  userName: string;
  onUnlock: () => void;
}

export function LockScreen({ userName, onUnlock }: LockScreenProps) {
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    try {
      setError('');
      const success = await authenticateBiometrics();
      if (success) {
        onUnlock();
      }
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível verificar a biometria. Tente novamente.');
    }
  };

  useEffect(() => {
    handleUnlock();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 p-4">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Fingerprint className="w-12 h-12 text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold mb-1">Bem-vindo de volta!</h1>
      <p className="text-slate-500 text-center max-w-xs mb-10">
        {userName}
      </p>

      <button
        onClick={handleUnlock}
        className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-sm"
      >
        <Fingerprint className="w-5 h-5" />
        Entrar com a Digital
      </button>

      {error && <p className="text-red-500 mt-4 text-sm text-center max-w-xs">{error}</p>}

      <button
        onClick={handleLogout}
        className="mt-12 text-slate-500 hover:text-slate-700 text-sm transition-colors"
      >
        Entrar com outra conta (Sair)
      </button>
    </div>
  );
}
