import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Container, Stack } from '@mantine/core'
import { OrderClipboardPaste } from '../components/OrderClipboardPaste'
import { useAppState, StateKeys } from '../lib/tauri-store/appState'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const navigate = useNavigate()
  const user = useAppState(StateKeys.user)
  const club = useAppState(StateKeys.club)
  
  if (!user || !club) {
    navigate({ to: '/setup', replace: true })
    return null
  }
  
  return (
    <Container size="xl" className="py-8">
      <Stack gap="xl">
        <OrderClipboardPaste 
          className="max-w-4xl mx-auto"
          user={user}
          club={club}
        />
      </Stack>
    </Container>
  )
}
