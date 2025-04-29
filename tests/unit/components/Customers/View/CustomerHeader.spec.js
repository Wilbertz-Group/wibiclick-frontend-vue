import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CustomerHeader from '@/components/Customers/View/CustomerHeader.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Mock the formatters
vi.mock('@/utils/formatters', () => ({
  formatFullDate: vi.fn(() => 'January 1, 2023'),
  formatRelativeTime: vi.fn(() => '2 days ago')
}));

describe('CustomerHeader.vue', () => {
  it('renders customer name correctly', () => {
    const wrapper = mount(CustomerHeader, {
      props: {
        customer: {
          name: 'Test Customer',
          createdAt: '2023-01-01T00:00:00Z'
        },
        isLoading: false
      },
      global: {
        components: {
          'font-awesome-icon': FontAwesomeIcon
        }
      }
    });
    
    expect(wrapper.text()).toContain('Test Customer');
  });
  
  it('shows loading text when customer name is not available', () => {
    const wrapper = mount(CustomerHeader, {
      props: {
        customer: {
          name: ''
        },
        isLoading: false
      },
      global: {
        components: {
          'font-awesome-icon': FontAwesomeIcon
        }
      }
    });
    
    expect(wrapper.text()).toContain('Loading Customer...');
  });
  
  it('emits navigate-back event when back button is clicked', async () => {
    const wrapper = mount(CustomerHeader, {
      props: {
        customer: {
          name: 'Test Customer'
        },
        isLoading: false
      },
      global: {
        components: {
          'font-awesome-icon': FontAwesomeIcon
        }
      }
    });
    
    const backButton = wrapper.find('button[title="Go Back"]');
    await backButton.trigger('click');
    
    expect(wrapper.emitted('navigate-back')).toBeTruthy();
    expect(wrapper.emitted('navigate-back').length).toBe(1);
  });
  
  it('shows HubSpot link when portal and foreignID are available', () => {
    const wrapper = mount(CustomerHeader, {
      props: {
        customer: {
          name: 'Test Customer',
          portal: '12345',
          foreignID: '67890'
        },
        isLoading: false
      },
      global: {
        components: {
          'font-awesome-icon': FontAwesomeIcon
        }
      }
    });
    
    const hubspotLink = wrapper.find('a[title="View on HubSpot"]');
    expect(hubspotLink.exists()).toBe(true);
    expect(hubspotLink.attributes('href')).toBe('https://app.hubspot.com/contacts/12345/contact/67890');
  });
  
  it('does not show HubSpot link when portal or foreignID is missing', () => {
    const wrapper = mount(CustomerHeader, {
      props: {
        customer: {
          name: 'Test Customer',
          // No portal or foreignID
        },
        isLoading: false
      },
      global: {
        components: {
          'font-awesome-icon': FontAwesomeIcon
        }
      }
    });
    
    const hubspotLink = wrapper.find('a[title="View on HubSpot"]');
    expect(hubspotLink.exists()).toBe(false);
  });
  
  it('shows spinner in refresh button when loading', () => {
    const wrapper = mount(CustomerHeader, {
      props: {
        customer: {
          name: 'Test Customer'
        },
        isLoading: true
      },
      global: {
        components: {
          'font-awesome-icon': FontAwesomeIcon
        }
      }
    });
    
    const refreshButton = wrapper.find('button[title="Refresh Data"]');
    expect(refreshButton.exists()).toBe(true);
    
    // Check if 'fa-spin' class is applied to FontAwesomeIcon
    // This is a simplified check, actual implementation may need to be adjusted based on how FA works in tests
    expect(refreshButton.html()).toContain('fa-spin');
  });
});