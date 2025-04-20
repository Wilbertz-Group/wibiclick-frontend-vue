import { mount } from '@vue/test-utils'
import PageList from '@/views/Visitors/Pages/PageList.vue'

describe('PageList.vue', () => {
  it('renders a list of pages', () => {
    const pages = [
      { id: 1, title: 'Page A', url: '/a' },
      { id: 2, title: 'Page B', url: '/b' }
    ]
    const wrapper = mount(PageList, {
      props: { pages, loading: false, selectedPageId: null }
    })
    expect(wrapper.text()).toContain('Page A')
    expect(wrapper.text()).toContain('Page B')
  })

  it('shows loading state', () => {
    const wrapper = mount(PageList, {
      props: { pages: [], loading: true }
    })
    expect(wrapper.text()).toContain('Loading...')
  })

  it('shows empty state when no pages', () => {
    const wrapper = mount(PageList, {
      props: { pages: [], loading: false }
    })
    expect(wrapper.text()).toContain('No pages found.')
  })

  it('emits select event when a page is clicked', async () => {
    const pages = [{ id: 1, title: 'Page A', url: '/a' }]
    const wrapper = mount(PageList, {
      props: { pages, loading: false, selectedPageId: null }
    })
    await wrapper.find('li').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual([1])
  })

  it('highlights the selected page', () => {
    const pages = [{ id: 1, title: 'Page A', url: '/a' }]
    const wrapper = mount(PageList, {
      props: { pages, loading: false, selectedPageId: 1 }
    })
    expect(wrapper.find('li').classes()).toContain('bg-blue-100')
  })
})