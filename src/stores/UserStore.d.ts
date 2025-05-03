declare module '@/stores/UserStore' {
  export interface UserStore {
    currentWebsite: string;
    // Add other properties or methods of the UserStore here if needed
  }

  export function useUserStore(): UserStore;
}