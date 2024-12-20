import { create } from "zustand";
import { axiosInstance } from "../Lib/axiosInstance";
import toast from "react-hot-toast";
import { io } from 'socket.io-client';

export const useAuthstore = create((set, get) => ({
    authUser: null,
    isSignUp: false,
    isLogin: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/verify");

            set({ authUser: res.data });
            get().connectSocket()
        } catch (error) {
            console.log('Error in checkAuth:', error);
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false })
        }
    },

    signup: async (data) => {
        set({ isSignUp: true })
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data });
            toast.success("Account created successfully");
            get().connectSocket()
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isSignUp: false })
        }
    },

    login: async (data) => {
        set({ isLogin: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            console.log("Login Response:", res);
            if (res?.data) {
                set({ authUser: res.data });
                toast.success("Login successfully");
                get().connectSocket()
            }
        } catch (error) {
            console.error("Login Error:", error.response || error);
            const errorMessage =
                error?.response?.data?.message || "Something went wrong";
            toast.error(errorMessage);
        } finally {
            set({ isLogin: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logout successfully");
            get().disConnectSocket()
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile:", error);
            toast.error(error.response.data.message);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: async () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;

        const socket = io("http://localhost:4000", {
            query: {
                userId: authUser._id,
            }
        });
        socket.connect()

        set({ socket: socket})

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds})
        })
    },

    disConnectSocket: async () => {
        if (get().socket?.connected) get().socket.disconnect()
    },
}))