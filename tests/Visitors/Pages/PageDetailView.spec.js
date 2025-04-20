import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue'; // Import ref
import PageDetailView from '@/views/Visitors/Pages/PageDetailView.vue';
import PerformanceMetricsDisplay from '@/views/Visitors/Pages/PerformanceMetricsDisplay.vue';
// We will mock the composable, so axios import/mock might not be needed for all tests
// import axios from 'axios';
// vi.mock('axios'); // Mock axios globally if needed for other tests

// Import the composable to mock it
import { usePageDetails } from '@/composables/usePageDetails.js';

// Mock the composable
vi.mock('@/composables/usePageDetails.js');

const page = { id: 1, title: 'Page A', url: '/a' };

describe('PageDetailView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation before each test if needed
    usePageDetails.mockClear();
  });

  it('fetches and displays metrics, rankings, update logs, and visitors', async () => {
    // Mock the composable's return value for this specific test
    usePageDetails.mockReturnValue({
      metrics: ref({ views: 100 }),
      rankings: ref([{ rank: 1 }]),
      updateLogs: ref([{ log: 'Updated' }]),
      visitors: ref([{ name: 'Visitor 1' }]),
      isLoading: ref({
        metrics: false,
        rankings: false,
        updateLogs: false,
        visitors: false,
      }),
      fetchAll: vi.fn(), // Mock fetchAll if needed
    });

    const wrapper = mount(PageDetailView, {
      props: { page },
    });
    // Wait for promises and Vue updates
    await flushPromises(); // Let API calls resolve
    await wrapper.vm.$nextTick(); // Let Vue update based on resolved promises
    await flushPromises(); // Handle any potential chained promises
    await wrapper.vm.$nextTick(); // Final Vue update cycle

    expect(wrapper.findComponent(PerformanceMetricsDisplay).props('metrics')).toEqual({ views: 100 })
    expect(wrapper.findComponent({ name: 'RankingsTable' }).props('rankings')).toEqual([{ rank: 1 }])
    expect(wrapper.findComponent({ name: 'UpdateLogList' }).props('logs')).toEqual([{ log: 'Updated' }])
    expect(wrapper.findComponent({ name: 'VisitorsTable' }).props('visitors')).toEqual([{ name: 'Visitor 1' }])
  })

  it('shows loading states for each section', async () => {
    // Mock the composable to return loading states
    usePageDetails.mockReturnValue({
      metrics: ref({}),
      rankings: ref([]),
      updateLogs: ref([]),
      visitors: ref([]),
      isLoading: ref({
        metrics: true,
        rankings: true,
        updateLogs: true,
        visitors: true,
      }),
      fetchAll: vi.fn(),
    });

    const wrapper = mount(PageDetailView, { props: { page } });

    // Assert loading props are true based on the mocked composable state
    expect(wrapper.findComponent(PerformanceMetricsDisplay).props('loading')).toBe(true);
    expect(wrapper.findComponent({ name: 'RankingsTable' }).props('loading')).toBe(true);
    expect(wrapper.findComponent({ name: 'UpdateLogList' }).props('loading')).toBe(true);
    expect(wrapper.findComponent({ name: 'VisitorsTable' }).props('loading')).toBe(true);

    // No need to resolve promises as the composable is mocked directly
    await flushPromises(); // Still good practice to flush any potential promises
  });

  it('reacts to page prop changes and refetches data', async () => {
    // Create refs for the composable's return values
    const metrics = ref({ views: 100 });
    const rankings = ref([{ rank: 1 }]);
    const updateLogs = ref([{ log: 'Updated' }]);
    const visitors = ref([{ name: 'Visitor 1' }]);
    const isLoading = ref({ metrics: false, rankings: false, updateLogs: false, visitors: false });

    usePageDetails.mockReturnValue({
      metrics,
      rankings,
      updateLogs,
      visitors,
      isLoading,
      fetchAll: vi.fn(),
    });

    const wrapper = mount(PageDetailView, {
      props: { page },
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    // Assert initial data is rendered
    expect(wrapper.findComponent(PerformanceMetricsDisplay).props('metrics')).toEqual({ views: 100 });
    expect(wrapper.findComponent({ name: 'RankingsTable' }).props('rankings')).toEqual([{ rank: 1 }]);
    expect(wrapper.findComponent({ name: 'UpdateLogList' }).props('logs')).toEqual([{ log: 'Updated' }]);
    expect(wrapper.findComponent({ name: 'VisitorsTable' }).props('visitors')).toEqual([{ name: 'Visitor 1' }]);

    // Change the composable's refs to simulate new data after prop change
    metrics.value = { views: 200 };
    rankings.value = [{ rank: 2 }];
    updateLogs.value = [{ log: 'Changed' }];
    visitors.value = [{ name: 'Visitor 2' }];

    // Change page prop
    const newPage = { id: 2, title: 'Page B', url: '/b' };
    await wrapper.setProps({ page: newPage });

    await flushPromises();
    await wrapper.vm.$nextTick();

    // Assert new data is rendered
    expect(wrapper.findComponent(PerformanceMetricsDisplay).props('metrics')).toEqual({ views: 200 });
    expect(wrapper.findComponent({ name: 'RankingsTable' }).props('rankings')).toEqual([{ rank: 2 }]);
    expect(wrapper.findComponent({ name: 'UpdateLogList' }).props('logs')).toEqual([{ log: 'Changed' }]);
    expect(wrapper.findComponent({ name: 'VisitorsTable' }).props('visitors')).toEqual([{ name: 'Visitor 2' }]);
  });
});