import { load, Store } from '@tauri-apps/plugin-store';
import { useEffect, useSyncExternalStore, useState, use } from 'react';

const ORDER_STORE_NAME = "order.json"

async function loadStore(path: string) {
  return load(path, { autoSave: false });
}

type HookState = {
  status: 'loading' | 'error'
} | { 
  status: 'ready',
  store: Store
}


/**
 * Hook to handle asynchronously loading a Tauri store.
 * 
 * @param storePath The path to the Tauri store to load.
 * @returns The state of the store loading process.
 */
export function useTauriStore(storePath = ORDER_STORE_NAME): HookState {
  const [state, setState] = useState<HookState>({status: 'loading'})
  
  useEffect(() => {
    async function run() {
      let store: Store
      try {
        store = await loadStore(storePath)
      } catch (e) {
        console.error(e)
        setState({status: 'error'})
        return
      }
      setState({ status: 'ready', store})
    }
    
    run()
  })
  
  return state
}

/**
 * Hook for reading a value from a Tauri store reactively.
 * @see {@link useMutableTauriStoreValue} if you need to write to the store.
 * 
 * @param store The Tauri store to read from.
 * @param key The key to read from the store.
 * @returns The value of the key in the store.
 */
export function useTauriStoreValue<Value extends unknown>(store: Store, key: string) {
  const unlistenerMap: Record<string, () => void> = {}
  
  const subscribe = (cb: () => void) => {
    // This subscribe function needs to be synchronous, but adding the event listener on the Store is a async op, 
    // so had to perform some slight shenanigans to make this work. Since we cannot wait for the unlisten function
    // to be resolved, we let the listener creation run its course in the background, and add the unlisten function
    // to the map whenever it is ready (which could be after this function returns).
    // 
    // Technically this has the possibility for a race condition. If the unsubscribe function gets called before 
    // the unlisten function is put into the map, the unlisten function will never be called. The chances of this
    // actually happening are small enough that I'm fine letting this be.
    const id = crypto.randomUUID()
    store.onKeyChange<Value>(key, cb).then(unlistener => unlistenerMap[id] = unlistener)
    return () => {
      unlistenerMap[id]?.()
      delete unlistenerMap[id]
    }
  }
  
  const getSnapshot = async () => {
    return await store.get<Value>(key)
  }
  
  return useSyncExternalStore(subscribe, getSnapshot)
}


/**
 * Hook for reading and writing a value from a Tauri store reactively.
 * 
 * @param store The Tauri store to read from.
 * @param key The key to read from the store.
 * @returns a tuple containing the value, and a function to set the value.
 */
export function useMutableTauriStoreValue<Value>(store: Store, key: string) {
  const valuePromise = useTauriStoreValue<Value>(store, key)
  
  // `use` is kinda weird icl. u should read the docs: https://react.dev/reference/react/use. 
  // tl;dr: it lets us use async values in react components by pausing a component's rendering
  // until the promise resolves with a value. 
  const unwrappedValue = use(valuePromise)
  
  const setValue = async (value: any) => {
    await store.set(key, value)
  }
  return [unwrappedValue, setValue] as const
}
