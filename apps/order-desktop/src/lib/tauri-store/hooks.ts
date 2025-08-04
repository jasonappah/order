import { load, type Store } from '@tauri-apps/plugin-store';
import { useEffect, useSyncExternalStore, useState } from 'react';
import { seedData } from './appState';
import {debug, info, warn, error} from "@tauri-apps/plugin-log"
import {isEqual} from 'lodash';


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
        info(`Loading store: ${storePath}`)
        store = await load(storePath);
        info('Loaded store successfully')
        if (clearData) {
          debug("Clearing store")
          await store.clear()
          debug('Cleared store')
        }
        if (seedWithDefaultData) {
          for (const [key, value] of Object.entries(seedData)) {
            debug(`Setting key: ${key}, value: ${JSON.stringify(value)}`)
            await store.set(key, value)
            debug(`Set key: ${key}, value: ${JSON.stringify(value)}`)
          }
        }
      } catch (e) {
        error(`Error loading store: ${e}`)
        setState({ status: 'error' })
        return
      }
      info('Setting state to ready')
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
  let value: Value | undefined = undefined;
  const [unlistenerMap, setUnlistenerMap] = useState<Record<string, () => void>>({})
  const [callbackMap, setCallbackMap] = useState<Record<string, () => void>>({})

  const runCallbacks = () => {
    for (const callback of Object.values(callbackMap)) {
      callback()
    }
  }

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
    store.onKeyChange<Value>(key, (newValue) => {
      const currentValue = value;
      if (!isEqual(currentValue, newValue)) {
        value = newValue;
        debug(`running callbacks since value changed: ${JSON.stringify(value)}`)
        runCallbacks()
      }
    }).then(unlistener => {
      debug(`Key change listener added, tracking unlistener: ${id}`)
      setUnlistenerMap(prev => ({ ...prev, [id]: unlistener }))
    })

    setCallbackMap(prev => ({ ...prev, [id]: cb }))
    return () => {
      debug(`Key change listener removed, untracking unlistener: ${id}`)
      setUnlistenerMap(prev => {
        const unlistener = prev[id]
        if (unlistener) {
          debug(`Calling unlistener: ${id}`)
          unlistener()
          const { [id]: removed, ...rest } = prev
          return rest
        }
        warn(`Key change listener removed, but unlistener not found: ${id}`)
        return prev
      })

      setCallbackMap(prev => {
        if (prev[id]) {
          debug(`removing callback: ${id}`)
          const { [id]: removed, ...rest } = prev
          return rest
        }
        warn(`Key change listener removed, but callback not found: ${id}`)
        return prev
      })
    }
  }
  
  const getSnapshot = () => {
    // Previously, we directly called store.get in this function to get a snapshot. however, store.get seems to return 
    // a new object each time it's called. this caused an [error]((https://react.dev/reference/react/useSyncExternalStore#im-getting-an-error-the-result-of-getsnapshot-should-be-cached)) 
    // because getSnapshot needs to return a stable value each time it's called if the value hasn't changed. 
    // 
    // To address the issue, we cache the value in a JS constant when we detect a change. The constant shouldn't get updated if there is no change to the value
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
    debug(`Setting value: ${key}, value: ${JSON.stringify(v)}`)
    await store.set(key, v)
    debug(`Set value: ${key}, value: ${JSON.stringify(v)}`)
  }
  return [value, setValue] as const
}
