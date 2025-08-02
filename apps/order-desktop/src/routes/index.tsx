import { createFileRoute } from '@tanstack/react-router'
import { Container, Title, Stack } from '@mantine/core'
import { OrderClipboardPaste } from '../components/OrderClipboardPaste'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {

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
