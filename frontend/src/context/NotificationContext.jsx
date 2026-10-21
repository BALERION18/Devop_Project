import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-400" style={{ color: 'var(--success)' }} />;
      case 'error':
        return <AlertCircle size={18} className="text-rose-400" style={{ color: 'var(--error)' }} />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-400" style={{ color: 'var(--warning)' }} />;
      default:
        return <Info size={18} className="text-indigo-400" style={{ color: 'var(--accent-primary)' }} />;
    }
  };

  return (
    <NotificationContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {getIcon(toast.type)}
            <span style={{ fontSize: '0.875rem' }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="btn-icon"
              style={{ marginLeft: 'auto', padding: '2px', cursor: 'pointer' }}
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
