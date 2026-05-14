import { create } from "zustand";
import { supabase } from "../lib/supabase";

const useAuthStore = create((set) => ({
    user: null,
    role: null,
    loading: true,

    setUser: (user, role) => set({ user, role }),
    clearUser: () => set({ user: null, role: null }),

    initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            const { data: userData } = await supabase
                .from("users")
                .select("role, full_name")
                .eq("id", session.user.id)
                .single();

            set({ user: session.user, role: userData?.role, loading: false });
        } else {
            set({ loading: false });
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const { data: userData } = await supabase
                    .from("users")
                    .select("role, full_name")
                    .eq("id", session.user.id)
                    .single();
                set({ user: session.user, role: userData?.role });
            } else {
                set({ user: null, role: null });
            }
        });
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, role: null });
    },
}));

export default useAuthStore;
