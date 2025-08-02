import { useOrderStoreValue, useMutableOrderStoreValue } from "./context";

export const StateKeys = {
  user: 'v1/user',
  club: 'v1/club'
} as const

type StateKeys = typeof StateKeys[keyof typeof StateKeys]

export type States = {
  [StateKeys.user]: {
    name: string;
    email: string;
    phone: string;
  };
  [StateKeys.club]: {
    type: 'comet-robotics'
  } | {
    type: 'other',
    name: string;
    
  };
};

export function useAppState<T extends keyof States>(key: T) {
  return useOrderStoreValue<States[T]>(key)
}

export function useMutableAppState<T extends keyof States>(key: T) {
  return useMutableOrderStoreValue<States[T]>(key)
}

export const seedData: States = {
  [StateKeys.club]: {
    type: 'comet-robotics'
  },
  [StateKeys.user]: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890'
  }
}