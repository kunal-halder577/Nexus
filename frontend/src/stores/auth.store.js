import { create } from "zustand";

const useAuthStore = create((set) => ({
  accessToken: null,
  isAuthenticated: false,
  isCheckingAuth: true, // Start as true since we fetch on load

  setAuth: (token) => set((state) => {
    if (state.accessToken === token) return state;
    return {
      accessToken: token, 
      isAuthenticated: !!token, 
      isCheckingAuth: false,
    };
  }),

  logout: () => set({ 
    accessToken: null, 
    isAuthenticated: false, 
    isCheckingAuth: false 
  }),

  setCheckingAuth: (status) => set({ isCheckingAuth: status })
}));

export default useAuthStore;