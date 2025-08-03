import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Container, Stack, Loader, Center } from '@mantine/core'
import { OrderClipboardPaste } from '../components/OrderClipboardPaste'
import { useAppState, StateKeys } from '../lib/tauri-store/appState'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const navigate = useNavigate()
  const userData = useAppState(StateKeys.user)
  const clubData = useAppState(StateKeys.club)

  useEffect(() => {
    // Check if user or club data is missing and redirect to setup
    if (userData !== undefined && clubData !== undefined) {
      if (!userData || !clubData) {
        navigate({ to: '/setup', replace: true })
      }
    }
  }, [userData, clubData, navigate])

  // Show loading while data is being fetched
  if (userData === undefined || clubData === undefined) {
    return (
      <Center className="h-screen">
        <Loader size="lg" />
      </Center>
    )
  }

  // If we don't have user or club data, we should be redirecting to setup
  // This is just a safeguard in case the effect hasn't run yet
  if (!userData || !clubData) {
    return (
      <Center className="h-screen">
        <Loader size="lg" />
      </Center>
    )
  }

  return (
    <Container size="xl" className="py-8">
      <Stack gap="xl">
        <OrderClipboardPaste 
          className="max-w-4xl mx-auto"
        />
      </Stack>
    </Container>
  )
}
