import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface PrivacyContextValue {
  masked: boolean;
  toggle: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({ masked: false, toggle: () => {} });

const STORAGE_KEY = 'bill-app-privacy-mask';

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [masked, setMasked] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  const toggle = useCallback(() => {
    setMasked(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  return (
    <PrivacyContext.Provider value={{ masked, toggle }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}

export function maskValue(value: string, masked: boolean): string {
  return masked ? '****' : value;
}
