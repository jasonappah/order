import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import Header from '../components/Header'
import { OrderStoreContext } from '@/lib/tauri-store/context'
import { useTauriStore } from '@/lib/tauri-store/hooks'

export const Route = createRootRoute({
  component: function() {
    const storeState = useTauriStore()
    switch (storeState.status) {
      case 'error': 
        return <p>Erm we lowkey have a problem</p>
      case 'loading': 
        return <p>Loading...</p>
      case 'ready':
        return (
          <OrderStoreContext.Provider value={storeState}>
            <Header />
            <Outlet />
            <TanStackRouterDevtools />
          </OrderStoreContext.Provider>
        )
    }
  }
})
