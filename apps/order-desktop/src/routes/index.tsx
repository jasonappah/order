import { createFileRoute } from '@tanstack/react-router'
import { Container, Title, Stack } from '@mantine/core'
import { OrderClipboardPaste } from '../components/OrderClipboardPaste'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const handleDataPaste = (data: string) => {
    console.log('Pasted data:', data)
    // TODO: Handle parsed data in upcoming sub-tasks
  }

  return (
    <Container size="xl" className="py-8">
      <Stack gap="xl">
        <div className="text-center">
          <Title order={1} className="text-3xl font-bold text-gray-800 mb-2">
            Order Management System
          </Title>
          <p className="text-gray-600 text-lg">
            Paste your order data and generate organized PDFs by vendor
          </p>
        </div>
        
        <OrderClipboardPaste 
          onDataPaste={handleDataPaste}
          className="max-w-4xl mx-auto"
        />
      </Stack>
    </Container>
  )
}
