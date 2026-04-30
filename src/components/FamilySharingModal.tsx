import React, { useState, useEffect } from 'react';
import { Users, Copy, CheckCircle2, UserPlus, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FamilySharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSettingsChanged?: () => void;
}

export function FamilySharingModal({ isOpen, onClose, userId, onSettingsChanged }: FamilySharingModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [linkedPartners, setLinkedPartners] = useState<{ id: string, partner_id: string }[]>([]);

  useEffect(() => {
    if (isOpen && userId) {
      setInviteCode(userId);
      fetchShares();
    }
  }, [isOpen, userId]);

  const fetchShares = async () => {
    try {
      const { data, error } = await supabase
        .from('account_shares')
        .select('*');
      
      if (error && error.code === '42P01') {
        // Table doesn't exist yet!
        setMessage('O recurso de grupo familiar precisa de uma atualização no banco de dados. Contate o administrador do sistema.');
        return;
      }
      
      if (data) {
        const partners = data.map(share => {
          const partnerId = share.owner_id === userId ? share.guest_id : share.owner_id;
          return { id: share.id, partner_id: partnerId };
        });
        setLinkedPartners(partners);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLinkPartner = async () => {
    if (!partnerCode.trim() || partnerCode === userId) {
      setMessage('Código de parceiro inválido.');
      return;
    }
    setLoading(true);
    setMessage('');
    
    try {
      // Create the share logic
      const { error } = await supabase
        .from('account_shares')
        .insert([{ owner_id: userId, guest_id: partnerCode }]);
        
      if (error) {
        if (error.code === '42P01') {
           setMessage('Erro: Tabelas do Banco de Dados não foram atualizadas.');
        } else if (error.code === '23505') {
           setMessage('Vocês já estão conectados!');
        } else {
           setMessage('Erro ao conectar. Código inválido ou já conectado.');
        }
        console.error(error);
      } else {
        setMessage('Parceiro conectado com sucesso!');
        setPartnerCode('');
        fetchShares();
        if (onSettingsChanged) onSettingsChanged();
      }
    } catch (err) {
      setMessage('Ocorreu um erro ao conectar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    const { error } = await supabase.from('account_shares').delete().eq('id', shareId);
    if (!error) {
      fetchShares();
      if (onSettingsChanged) onSettingsChanged();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Acesso Casal / Família</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('Erro') || message.includes('inválido') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-emerald-600'}`}>
              {message}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">Seu Código de Convite</h3>
            <p className="text-xs text-slate-500 mb-2">Envie este código para seu parceiro(a) para que ele adicione no aplicativo dele.</p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={inviteCode} 
                readOnly 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 font-mono text-sm focus:outline-none"
              />
              <button 
                onClick={handleCopy}
                className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors shrink-0"
                title="Copiar código"
              >
                {isCopied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">Conectar com Parceiro(a)</h3>
            <p className="text-xs text-slate-500 mb-2">Se você recebeu o código do seu parceiro(a), cole aqui para unir as transações.</p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Cole o código do parceiro" 
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
              />
              <button 
                onClick={handleLinkPartner}
                disabled={loading || !partnerCode.trim()}
                className="p-3 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shrink-0"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {linkedPartners.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-700">Contas Conectadas</h3>
              <div className="space-y-2">
                {linkedPartners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-mono text-slate-600 truncate mr-2">...{partner.partner_id.slice(-8)}</span>
                    <button 
                      onClick={() => handleRemoveShare(partner.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0"
                      title="Desconectar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
