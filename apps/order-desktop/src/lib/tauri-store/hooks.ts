import { load, type Store } from '@tauri-apps/plugin-store';
import { useEffect, useSyncExternalStore, useState } from 'react';
import { seedData } from './appState';
import { debug, info, error } from "@tauri-apps/plugin-log"
import { isEqual } from 'lodash';


const ORDER_STORE_NAME = "order.json"

export type ReadyState = { 
  status: 'ready',
  store: Store,
  eventTarget: EventTarget,
  valueCache: Map<string, unknown>
}

type HookState = {
  status: 'loading' | 'error'
} | ReadyState


/**
 * Hook to handle asynchronously loading a Tauri store.
 * 
 * @param storePath The path to the Tauri store to load.
 * @returns The state of the store loading process.
 */
export function useTauriStore(storePath = ORDER_STORE_NAME, seedWithDefaultData = false, clearData = false): HookState {
  const [state, setState] = useState<HookState>({status: 'loading'})
  
  useEffect(() => {
    async function run() {
      let store: Store
      try {
        info(`Loading store: ${storePath}`)
        store = await load(storePath);
        info('Loaded store successfully')
        if (clearData) {
          debug("Clearing store")
          await store.clear()
          debug('Cleared store')
        }

        const valueCache = new Map<string, any>();
        const eventTarget = new EventTarget();

        if (seedWithDefaultData) {
          for (const [key, value] of Object.entries(seedData)) {
            debug(`Setting key: ${key}, value: ${JSON.stringify(value)}`)
            await store.set(key, value)
            debug(`Set key: ${key}, value: ${JSON.stringify(value)}`)
          }
        }
        
        const entries = await store.entries()
        for (const [key, value] of entries) {
          valueCache.set(key, value)
        }

        await store.onChange((key, value) => {
          const oldValue = valueCache.get(key);
          if (!isEqual(oldValue, value)) {
            valueCache.set(key, value);
            eventTarget.dispatchEvent(new CustomEvent('store-change', { detail: { key } }));
          }
        })

        info('Setting state to ready')
        setState({ status: 'ready', store, eventTarget, valueCache})

      } catch (e) {
        error(`Error loading store: ${e}`)
        setState({ status: 'error' })
        return
      }
    }
    
    run()
  }, [storePath, seedWithDefaultData, clearData])
  
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
export function useTauriStoreValue<Value>(eventTarget: EventTarget, valueCache: Map<string, any>, key: string) {
  const subscribe = (callback: () => void) => {
    const listener = (evt: Event) => {
      const { key: changedKey } = (evt as CustomEvent).detail;
      if (changedKey === key) {
        callback();
      }
    }
    eventTarget.addEventListener('store-change', listener);
    return () => eventTarget.removeEventListener('store-change', listener);
  }
  
  const getSnapshot = () => {
    return valueCache.get(key) as Value
  }
  
  return useSyncExternalStore(subscribe, getSnapshot)
}


/**
 * Hook for reading and writing a value from a Tauri store reactively.
 * @see {@link useTauriStoreValue} if you don't need to mutate the value.
 * 
 * @param store The Tauri store to read from.
 * @param key The key to read from the store.
 * @returns a tuple containing the value, and a function to set the value.
 */
export function useMutableTauriStoreValue<Value>(store: Store, eventTarget: EventTarget, valueCache: Map<string, any>, key: string) {
  const value = useTauriStoreValue<Value>(eventTarget, valueCache, key)
  
  const setValue = async (v: Value) => {
    debug(`Setting value: ${key}, value: ${JSON.stringify(v)}`)
    await store.set(key, v)
    debug(`Set value: ${key}, value: ${JSON.stringify(v)}`)
  }
  return [value, setValue] as const
}
