import { load, type Store } from '@tauri-apps/plugin-store';
import { useEffect, useSyncExternalStore, useState } from 'react';
import { seedData } from './appState';
import loglevel from 'loglevel';

const log = loglevel.getLogger('tauri-store')

const ORDER_STORE_NAME = "order.json"

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
export function useTauriStore(storePath = ORDER_STORE_NAME, seedWithDefaultData = false, clearData = false): HookState {
  const [state, setState] = useState<HookState>({status: 'loading'})
  
  useEffect(() => {
    async function run() {
      let store: Store
      try {
        log.info('Loading store', storePath)
        store = await load(storePath);
        log.info('Loaded store', store)
        if (clearData) {
          log.trace("Clearing store")
          await store.clear()
          log.trace('Cleared store')
        }
        if (seedWithDefaultData) {
          for (const [key, value] of Object.entries(seedData)) {
            log.trace('Setting key', key, value)
            await store.set(key, value)
            log.trace('Set key', key, value)
          }
        }
      } catch (e) {
        log.error('Error loading store', e)
        setState({ status: 'error' })
        return
      }
      log.info('Setting state to ready', store)
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
export function useTauriStoreValue<Value>(store: Store, key: string) {
  const [value, setValue] = useState<Value | undefined>(undefined)
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
    store.onKeyChange<Value>(key, (value) => {
      setValue(value)
      cb()
    }).then(unlistener => {
      log.trace('Key change listener added, tracking unlistener', id)
      unlistenerMap[id] = unlistener
    })
    return () => {
      log.trace('Key change listener removed, untracking unlistener', id)
      const unlistener = unlistenerMap[id]
      if (unlistener) {
        log.trace('Calling unlistener', id)
        unlistener()
        delete unlistenerMap[id]
      } else {
        log.warn('Key change listener removed, but unlistener not found', id)
      }
    }
  }
  
  const getSnapshot = () => {
    // Previously, we directly called store.get in this function to get a snapshot. however, store.get seems to return 
    // a new object each time it's called. this caused an [error]((https://react.dev/reference/react/useSyncExternalStore#im-getting-an-error-the-result-of-getsnapshot-should-be-cached)) 
    // because getSnapshot needs to return a stable value each time it's called if the value hasn't changed. 
    // 
    // To address the issue, we cache the value in React state when we detect a change. React state will remain stable
    // as long as the value is the same.
    return value
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
export function useMutableTauriStoreValue<Value>(store: Store, key: string) {
  const value = useTauriStoreValue<Value>(store, key)
  
  const setValue = async (v: Value) => {
    log.trace('Setting value', key, v)
    await store.set(key, v)
    log.trace('Set value', key, v)
  }
  return [value, setValue] as const
}
