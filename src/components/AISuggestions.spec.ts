// wibiclick-frontend-vue/src/components/AISuggestions.spec.ts
import { describe, it, expect, vi, Mocked } from 'vitest'
import { mount } from '@vue/test-utils'
import AISuggestions from './AISuggestions.vue'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as Mocked<typeof axios>

describe('AISuggestions.vue', () => {
  const mockProps = {
    contactId: 'contact-123',
    visitorActivity: { pageviews: 5, timeSpent: 300 }
  }

  it('renders initial state correctly', () => {
    const wrapper = mount(AISuggestions, {
      props: mockProps
    })

    // Check if the button exists and shows the correct text
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('AI Suggest')
    expect(button.attributes('disabled')).toBeUndefined() // Button should not be disabled initially

    // Check that no suggestions are rendered initially
    // Check that no suggestions are rendered initially (find the container div)
    expect(wrapper.find('.mt-4.space-y-4').exists()).toBe(false)

    // Check that no error message is displayed initially (find the container div)
    expect(wrapper.find('.text-red-500.mt-2').exists()).toBe(false)
  })

  it('shows loading state when button is clicked', async () => {
    // Mock axios to return a promise that never resolves
    mockedAxios.post.mockReturnValue(new Promise(() => {}))
    
    const wrapper = mount(AISuggestions, {
      props: mockProps
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(button.text()).toBe('Loading...')
    expect(button.attributes('disabled')).toBeDefined()
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/ai/suggest-matches', {
      contactId: mockProps.contactId,
      visitorActivity: mockProps.visitorActivity
    })
  })

  it('handles successful API response', async () => {
    const mockResponse = {
      data: {
        suggestions: [
          {
            visitorId: 'visitor-1',
            confidence: 85,
            reasoning: 'Similar browsing patterns'
          }
        ]
      }
    }
    mockedAxios.post.mockResolvedValue(mockResponse)

    const wrapper = mount(AISuggestions, {
      props: mockProps
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    // Wait for Vue to update DOM
    await wrapper.vm.$nextTick()

    // Verify loading state is cleared
    expect(button.text()).toBe('AI Suggest')
    expect(button.attributes('disabled')).toBeUndefined()

    // Verify suggestions are rendered
    const suggestions = wrapper.findAll('.mt-4.space-y-4 > div')
    expect(suggestions.length).toBe(1)
    expect(suggestions[0].text()).toContain('Visitor ID: visitor-1')
    expect(suggestions[0].text()).toContain('Confidence: 85%')
    expect(suggestions[0].text()).toContain('Reasoning: Similar browsing patterns')
  })

  it('handles API errors', async () => {
    const errorResponse = {
      response: {
        data: { message: 'Server error' },
        status: 500
      }
    }
    mockedAxios.post.mockRejectedValue(errorResponse)

    const wrapper = mount(AISuggestions, {
      props: mockProps
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    // Wait for Vue to update DOM
    await wrapper.vm.$nextTick()

    // Verify loading state is cleared
    expect(button.text()).toBe('AI Suggest')
    expect(button.attributes('disabled')).toBeUndefined()

    // Verify error message is shown
    const errorDiv = wrapper.find('.text-red-500.mt-2')
    expect(errorDiv.exists()).toBe(true)
    expect(errorDiv.text()).toBe('Server error')
  })

  it('calls confirm handler when confirm button is clicked', async () => {
    const mockResponse = {
      data: {
        suggestions: [{
          visitorId: 'visitor-1',
          confidence: 85,
          reasoning: 'Test reasoning'
        }]
      }
    }
    mockedAxios.post.mockResolvedValue(mockResponse)

    const wrapper = mount(AISuggestions, {
      props: mockProps
    })

    // Trigger API call
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    // Mock confirm handler
    const confirmSpy = vi.spyOn(wrapper.vm, 'handleConfirmSuggestion')

    // Click confirm button
    const confirmBtn = wrapper.find('.bg-green-500')
    await confirmBtn.trigger('click')

    expect(confirmSpy).toHaveBeenCalledWith(mockResponse.data.suggestions[0])
  })

  it('calls reject handler when reject button is clicked', async () => {
    const mockResponse = {
      data: {
        suggestions: [{
          visitorId: 'visitor-1',
          confidence: 85,
          reasoning: 'Test reasoning'
        }]
      }
    }
    mockedAxios.post.mockResolvedValue(mockResponse)

    const wrapper = mount(AISuggestions, {
      props: mockProps
    })

    // Trigger API call
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    // Mock reject handler
    const rejectSpy = vi.spyOn(wrapper.vm, 'handleRejectSuggestion')

    // Click reject button
    const rejectBtn = wrapper.find('.bg-red-500')
    await rejectBtn.trigger('click')

    expect(rejectSpy).toHaveBeenCalledWith(mockResponse.data.suggestions[0])
  })
})