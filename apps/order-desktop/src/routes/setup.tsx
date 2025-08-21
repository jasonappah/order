import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  TextInput, 
  Select, 
  Button, 
  Stack, 
  Group,
  Alert
} from '@mantine/core'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useMutableAppState, StateKeys } from '../lib/tauri-store/appState'

export const Route = createFileRoute('/setup')({
  component: SetupPage,
})

function SetupPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  const [userData, setUserData] = useMutableAppState(StateKeys.user)
  const [clubData, setClubData] = useMutableAppState(StateKeys.club)
  
  const hasExistingData = userData && clubData
  
  const form = useForm({
    defaultValues: {
      userName: userData?.name || '',
      userEmail: userData?.email || '',
      userPhone: userData?.phone || '',
      clubType: (clubData?.type || 'comet-robotics') as 'comet-robotics' | 'other',
      clubName: (clubData && clubData?.type === 'other') ? clubData.name : '',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        // Save user data
        await setUserData({
          name: value.userName,
          email: value.userEmail,
          phone: value.userPhone,
        })
        
        // Save club data
        if (value.clubType === 'comet-robotics') {
          await setClubData({
            type: 'comet-robotics'
          })
        } else {
          await setClubData({
            type: 'other',
            name: value.clubName
          })
        }
        
        setSubmitSuccess(true)
        
        // Navigate to home after a brief delay
        setTimeout(() => {
          navigate({ to: '/' })
        }, 1500)
        
      } catch (error) {
        console.error('Error saving setup data:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  if (submitSuccess) {
    return (
      <Container size="sm" className="py-16">
        <Paper p="xl" withBorder radius="md" className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <Title order={2} className="text-green-700 mb-2">
            {hasExistingData ? 'Information Updated!' : 'Setup Complete!'}
          </Title>
          <Text c="dimmed">Redirecting you to the main application...</Text>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="sm" className="py-8">
      <Paper p="xl" withBorder radius="md">
        <Title order={1} className="text-center mb-2">
          {hasExistingData ? 'Edit Your Information' : 'Welcome!'}
        </Title>
        <Text c="dimmed" className="text-center mb-8">
          {hasExistingData 
            ? 'Update your personal and organization information below.'
            : "Let's get your account set up. We need some basic information to get started."
          }
        </Text>
        
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <Stack gap="lg">
            <div>
              <Title order={3} className="mb-4">Personal Information</Title>
              
              <form.Field
                name="userName"
                validators={{
                  onChange: ({ value }) => 
                    !value ? 'Name is required' : undefined,
                }}
              >
                {(field) => (
                  <TextInput
                    label="Full Name"
                    placeholder="Enter your full name"
                    required
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={field.state.meta.isTouched && field.state.meta.errors}
                    className="mb-4"
                  />
                )}
              </form.Field>

              <form.Field
                name="userEmail"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return 'Email is required'
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                      return 'Please enter a valid email address'
                    }
                    return undefined
                  },
                }}
              >
                {(field) => (
                  <TextInput
                    label="Email Address"
                    placeholder="Enter your email"
                    type="email"
                    required
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={field.state.meta.isTouched && field.state.meta.errors}
                    className="mb-4"
                  />
                )}
              </form.Field>

              <form.Field
                name="userPhone"
                validators={{
                  onChange: ({ value }) => 
                    !value ? 'Phone number is required' : undefined,
                }}
              >
                {(field) => (
                  <TextInput
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    required
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={field.state.meta.isTouched && field.state.meta.errors}
                  />
                )}
              </form.Field>
            </div>

            <div>
              <Title order={3} className="mb-4">Organization Information</Title>
              
              <form.Field name="clubType">
                {(field) => (
                  <Select
                    label="Organization Type"
                    placeholder="Select your organization"
                    required
                    value={field.state.value}
                    onChange={(value) => field.handleChange(value as 'comet-robotics' | 'other')}
                    data={[
                      { value: 'comet-robotics', label: 'Comet Robotics' },
                      { value: 'other', label: 'Other Organization...' },
                    ]}
                    className="mb-4"
                  />
                )}
              </form.Field>

              <form.Subscribe
                selector={(state) => [state.values.clubType]}
              >
                  {([clubType]) => {
                    if (clubType !== 'comet-robotics') {
                      return <form.Field
                        name="clubName"
                        validators={{
                          onChange: ({ value, fieldApi }) => {
                            const clubType = fieldApi.form.getFieldValue('clubType')
                            if (clubType === 'other' && !value) {
                              return 'Organization name is required'
                            }
                            return undefined
                          },
                        }}
                      >
                        {(field) => {
                          return (
                            <TextInput
                              label="Organization Name"
                              placeholder="Enter your organization name"
                              required={true}
                              disabled={false}
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              onBlur={field.handleBlur}
                              error={field.state.meta.isTouched && field.state.meta.errors}
                            />
                          )
                        }}
                      </form.Field>
                    }
                    return null
                  }}
              </form.Subscribe>
              
              
              
              
            </div>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Group justify="flex-end" className="mt-6">
                  <Button
                    type="submit"
                    size="lg"
                    loading={isSubmitting}
                    disabled={!canSubmit || isSubmitting}
                  >
                    {hasExistingData ? 'Update Information' : 'Complete Setup'}
                  </Button>
                </Group>
              )}
            </form.Subscribe>
          </Stack>
        </form>
        
        <Alert 
          icon={<AlertCircle size={16} />} 
          title="Note" 
          className="mt-6"
          variant="light"
        >
          {hasExistingData 
            ? 'Your information is stored locally on your device and used to populate order forms. You can update it anytime from this page.'
            : 'This information will be stored locally on your device and used to populate order forms.'
          }
        </Alert>
      </Paper>
    </Container>
  )
}