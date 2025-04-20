import { mount, flushPromises } from '@vue/test-utils'
import PagesView from '@/views/Visitors/Pages/PagesView.vue'
import axios from 'axios'

vi.mock('axios')

describe('PagesView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and displays a list of pages', async () => {
    axios.get.mockResolvedValueOnce({ data: [
      { id: 1, title: 'Page A', url: '/a' },
      { id: 2, title: 'Page B', url: '/b' }
    ]})
    const wrapper = mount(PagesView)
    await flushPromises()
    expect(wrapper.text()).toContain('Page A')
    expect(wrapper.text()).toContain('Page B')
  })

  it('shows loading state while fetching pages', async () => {
    let resolve
    axios.get.mockReturnValue(new Promise(r => { resolve = r }))
    const wrapper = mount(PagesView)
    // Wait for DOM update before checking loading state
    await wrapper.vm.$nextTick();
    const pageList = wrapper.findComponent({ name: 'PageList' });
    expect(pageList.text()).toContain('Loading...');
    resolve({ data: [] })
    await flushPromises()
  })

  it('shows error state if fetch fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mount(PagesView)
    await flushPromises()
    expect(wrapper.text()).toContain('Select a page to view details.')
  })

  it('selects a page and displays its details', async () => {
    axios.get.mockResolvedValueOnce({ data: [
      { id: 1, title: 'Page A', url: '/a' }
    ]})
    const wrapper = mount(PagesView)
    await flushPromises()
    // Simulate selecting the page
    await wrapper.findComponent({ name: 'PageList' }).vm.$emit('select', 1)
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'PageDetailView' }).exists()).toBe(true)
  })
})