import { useState, useCallback } from 'react';

// Simple toast hook — returns showToast fn and the Toast component
export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const Toast = toast ? (
    <div className={`toast toast-${toast.type}`}>
      {toast.type === 'success' ? '✓' : '✕'} {toast.message}
    </div>
  ) : null;

  return { showToast, Toast };
};
