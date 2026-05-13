import { createContext, useState, useCallback, useContext } from "react";

export const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState({});

  const setItemLoading = useCallback((key, isLoading) => {
    setLoading(prev => ({ ...prev, [key]: isLoading }));
  }, []);

  const value = {
    loading,
    setItemLoading,
    isLoading: (key) => loading[key] || false,
    setMultipleLoading: (keys, isLoading) => {
      setLoading(prev => {
        const updated = { ...prev };
        keys.forEach(key => {
          updated[key] = isLoading;
        });
        return updated;
      });
    }
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (key) => {
  const context = useContext(LoadingContext);
  
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }

  return {
    isLoading: context.loading[key] || false,
    setLoading: (value) => context.setItemLoading(key, value),
    startLoading: () => context.setItemLoading(key, true),
    stopLoading: () => context.setItemLoading(key, false)
  };
};
