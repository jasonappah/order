import type { Store } from '@tauri-apps/plugin-store';
import { createContext, useContext } from 'react';
import { useMutableTauriStoreValue, useTauriStoreValue } from './hooks';

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
 * @see {@link useOrderStoreValue} if you don't need to mutate the value.
 * 
 * @param store The Tauri store to read from.
 * @param key The key to read from the store.
 * @returns a tuple containing the value, and a function to set the value.
 */
export function useMutableOrderStoreValue<Value>(key: string) {
  const store = useOrderStoreContext();
  return useMutableTauriStoreValue<Value>(store, key)
}

/**
 * Provides a value from the order store.
 * @see {@link useMutableOrderStoreValue} if you need to mutate the value.
 * 
 * @param key The key to read from the store.
 * @returns the value
 */
export function useOrderStoreValue<Value>(key: string) {
  const store = useOrderStoreContext();
  return useTauriStoreValue<Value>(store, key)
}
 