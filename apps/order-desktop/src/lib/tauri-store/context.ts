import type { Store } from '@tauri-apps/plugin-store';
import { createContext, useContext } from 'react';
import { useMutableTauriStoreValue } from './hooks';

export const OrderStoreContext = createContext<Store | undefined>(undefined);

const useOrderStoreContext = () => {
  const contextValue = useContext(OrderStoreContext)
  
  if (!contextValue) {
    throw new Error("OrderStoreContext must be used within a OrderStoreContextProvider");
  }

  return contextValue
}


/**
 * Provides a mutable value from the order store.
 * 
 * @param store The Tauri store to read from.
 * @param key The key to read from the store.
 * @returns a tuple containing the value, and a function to set the value.
 */
export function useOrderStoreValue(key: string) {
  const store = useOrderStoreContext();
  return useMutableTauriStoreValue(store, key)
}