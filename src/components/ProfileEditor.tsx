import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, User, Mail, Phone, Save, CheckCircle2, Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { checkBiometricsAvailable, registerBiometrics, disableBiometrics, isBiometricsEnabled } from '../lib/biometrics';

interface ProfileEditorProps {
  userName: string;
  onSave: (name: string) => void;
  onBack: () => void;
}

export function ProfileEditor({ userName, onSave, onBack }: ProfileEditorProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(isBiometricsEnabled());

  useEffect(() => {
    checkBiometricsAvailable().then(setBiometricsAvailable);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setName(session.user.user_metadata?.full_name || userName);
        setEmail(session.user.email || '');
        setPhotoURL(session.user.user_metadata?.avatar_url || null);
        setPhone(session.user.phone || '');
      }
    });
  }, [userName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleBiometrics = async () => {
    if (biometricsEnabled) {
      disableBiometrics();
      setBiometricsEnabled(false);
    } else {
      try {
        const success = await registerBiometrics(email || 'user@example.com', name);
        if (success) {
          setBiometricsEnabled(true);
        }
      } catch (error) {
        console.error(error);
        alert("Erro ao configurar biometria. Certifique-se de que seu dispositivo suporta essa função e que você não cancelou a operação.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: email,
        phone: phone,
        data: {
          full_name: name,
          avatar_url: photoURL
        }
      });
      
      if (error) throw error;
      
      setIsSaving(false);
      setSaveSuccess(true);
      onSave(name);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white/80 border-b border-slate-200 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-lg">Editar Perfil</h1>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm"
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            <div 
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-28 h-28 rounded-full bg-slate-200 p-1">
                <div className="w-full h-full rounded-full bg-white overflow-hidden">
                  <img 
                    src={photoURL || "https://picsum.photos/seed/user/200/200"} 
                    alt="Profile" 
                    className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-slate-900/80 p-2 rounded-full text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </div>
            </div>
            <p 
              className="text-sm text-blue-600 mt-3 font-medium cursor-pointer hover:text-blue-700 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              Alterar foto de perfil
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="Seu nome"
                  required
                />
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="seu@email.com"
                  required
                />
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-11 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="(00) 00000-0000"
                />
                <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {biometricsAvailable && (
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-blue-600" /> Segurança
                </h3>
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Acesso com Digital / Face ID</p>
                    <p className="text-xs text-slate-500 mt-0.5">Exigir biometria ao abrir o aplicativo</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleBiometrics}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${biometricsEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${biometricsEnabled ? 'translate-x-6' : 'translate-x-1'} shadow-sm`} />
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-2">
              <button 
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-sm"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Salvo com sucesso!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
