import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CalendarClock, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
}

interface DueAlertsProps {
  transactions: Transaction[];
  onDismiss?: () => void;
}

interface AlertItem {
  id: string;
  title: string;
  message: string;
  daysDiff: number;
  transaction: Transaction;
}

export function DueAlerts({ transactions }: DueAlertsProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('adielpay_dismissed_alerts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    // Also try to request Notification permission for actual OS notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const generatedAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newAlerts: AlertItem[] = [];

    transactions?.forEach(tx => {
      if (tx.type !== 'expense') return; // only care about expenses/installments

      const txDatePart = tx.date.split('-'); // YYYY-MM-DD
      const txDate = new Date(parseInt(txDatePart[0]), parseInt(txDatePart[1]) - 1, parseInt(txDatePart[2]));
      txDate.setHours(0, 0, 0, 0);

      const diffTime = txDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 2) {
        // Formulate the message
        let message = '';
        let title = 'Aviso de Vencimento';

        if (diffDays === 0) {
          message = `O pagamento da parcela de "${tx.description}" vence HOJE!`;
          title = 'Vence Hoje!';
        } else if (diffDays === 1) {
          message = `Sua fatura da parcela de "${tx.description}" vence AMANHÃ.`;
        } else if (diffDays === 2) {
          message = `Lembrete: O pagamento de "${tx.description}" vence em 2 dias.`;
        }

        const alertId = `${tx.id}-${diffDays}`;

        if (!dismissedAlerts[alertId]) {
          newAlerts.push({
            id: alertId,
            title,
            message,
            daysDiff: diffDays,
            transaction: tx
          });
        }
      }
    });

    return newAlerts;
  }, [transactions, dismissedAlerts]);

  useEffect(() => {
    setAlerts(generatedAlerts);

    // Fire OS native notifications (only once per browser session/day? To avoid spamming, we rely on dismissed state or we just show them if generatedAlerts changed and has unshown OS native ones)
    if ('Notification' in window && Notification.permission === 'granted') {
      generatedAlerts.forEach(a => {
        const notifKey = `adielpay_os_notif_${a.id}`;
        if (!sessionStorage.getItem(notifKey)) {
          new Notification(a.title, { body: a.message, icon: '/favicon.ico' });
          sessionStorage.setItem(notifKey, 'true');
        }
      });
    }
  }, [generatedAlerts]);

  const handleDismiss = (id: string) => {
    const newDismissed = { ...dismissedAlerts, [id]: true };
    setDismissedAlerts(newDismissed);
    localStorage.setItem('adielpay_dismissed_alerts', JSON.stringify(newDismissed));
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none flex flex-col gap-3 items-center pt-safe-top mt-4">
      <AnimatePresence>
        {alerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
            className={`pointer-events-auto max-w-sm w-full shadow-2xl rounded-2xl p-4 flex gap-4 items-start border relative overflow-hidden backdrop-blur-md
              ${alert.daysDiff === 0 
                ? 'bg-red-500/90 border-red-400 text-white shadow-red-500/20' 
                : alert.daysDiff === 1
                  ? 'bg-amber-500/90 border-amber-400 text-white shadow-amber-500/20'
                  : 'bg-blue-600/90 border-blue-400 text-white shadow-blue-500/20'
              }
            `}
          >
            <div className={`p-2 rounded-full ${alert.daysDiff === 0 ? 'bg-red-400/50' : alert.daysDiff === 1 ? 'bg-amber-400/50' : 'bg-blue-500/50'} shrink-0`}>
              {alert.daysDiff === 0 ? <AlertCircle className="w-6 h-6" /> : <CalendarClock className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 min-w-0 pb-1">
              <h4 className="font-bold text-sm tracking-wide mb-1 flex items-center justify-between">
                {alert.title}
                <span className="text-xs font-medium opacity-80 whitespace-nowrap ml-2">
                  R$ {Math.abs(alert.transaction.amount).toFixed(2).replace('.', ',')}
                </span>
              </h4>
              <p className="text-sm font-medium leading-tight opacity-95">
                {alert.message}
              </p>
            </div>

            <button 
              onClick={() => handleDismiss(alert.id)}
              className="shrink-0 p-1 rounded-full hover:bg-black/20 transition-colors bg-black/10"
              aria-label="Dispensar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
