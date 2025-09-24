import { useOrderStoreValue, useMutableOrderStoreValue } from "./context";

const V1StateKeys = {
  user: 'v1/user',
  club: 'v1/club'
} as const
type V1StateKeys = typeof V1StateKeys[keyof typeof V1StateKeys]


const V2StateKeys = {
  user: 'v2/user',
  club: 'v2/club'
} as const
type V2StateKeys = typeof V2StateKeys[keyof typeof V2StateKeys]

export const StateKeys = V2StateKeys
export type StateKeys = V2StateKeys

export type V1States = {
  [V1StateKeys.user]: {
    name: string;
    email: string;
    phone: string;
  };
  [V1StateKeys.club]: {
    type: 'comet-robotics'
  } | {
    type: 'other',
    name: string;
    
  };
};

type V2States = {
  [V2StateKeys.user]: Omit<V1States[typeof V1StateKeys.user], 'name'> & {
    netId: string;
    firstName: string;
    lastName: string;
  };
  [V2StateKeys.club]: V1States[typeof V1StateKeys.club] & {
    advisor: {
      name: string;
      email: string;
    };
  };
}

export type States = V2States

export function useAppState<T extends keyof States>(key: T) {
  return useOrderStoreValue<States[T]>(key)
}

export function useMutableAppState<T extends keyof States>(key: T) {
  return useMutableOrderStoreValue<States[T]>(key)
}

export const seedData: States = {
  [StateKeys.club]: {
    type: 'comet-robotics',
    advisor: {
      name: 'John Doe',
      email: 'john.doe@example.com',
    }
  },
  [StateKeys.user]: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    netId: 'dal000000'
  }
}