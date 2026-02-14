"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X, User, Mail, Lock, ArrowRight, Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";


// --- Types ---

export type UserData = {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
};



type AuthMode = 'signin' | 'signup';

interface AuthContextType {
    user: UserData | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    showAuthOverlay: () => void;
    hideAuthOverlay: () => void;
    requireAuth: (action?: () => void) => void;
    login: (formData: any) => Promise<void>;
    logout: () => void;
    theme: 'light' | 'dark';
}

// --- Context ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// --- Provider Component ---

interface AuthProviderProps {
    children: ReactNode;
    theme?: 'light' | 'dark';
}

export default function AuthProvider({ children, theme = 'light' }: AuthProviderProps) {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Initial Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("http://localhost:8080/campus-navigator-backend/check-auth.php", {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setUser(data.user);
                    }
                }
            } catch (err) {
                console.error("Auth check failed:", err);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const showAuthOverlay = () => setIsOverlayOpen(true);

    const hideAuthOverlay = () => {
        setIsOverlayOpen(false);
        setPendingAction(null);
    };

    const login = async (formData: any) => {
        try {
            const formDataObj = new FormData();
            Object.keys(formData).forEach(key => formDataObj.append(key, formData[key]));

            const res = await fetch("http://localhost:8080/campus-navigator-backend/login.php", {
                method: "POST",
                body: formDataObj,
                credentials: "include"
            });

            const data = await res.json();

            console.log("Login response:", data);

            if (data.status === "success") {

                if (data.user) {
                    setUser(data.user);

                    // ✅ Store role locally (UI control only)
                    localStorage.setItem("role", data.user.role);
                    localStorage.setItem("user_id", data.user.id);
                    localStorage.setItem("user_name", data.user.name);

                    // ✅ Redirect based on role
                    if (["admin", "superadmin"].includes(data.user.role)) {
                        router.push("/admin");
                    } else {
                        router.push("/");
                    }
                }

                if (pendingAction) {
                    pendingAction();
                    setPendingAction(null);
                }

            }

            else {
                throw new Error(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const logout = async () => {
        setUser(null);
        try {
            // Optional: call logout endpoint if needed
        } catch (e) { }
    };

    const requireAuth = (action?: () => void) => {
        if (user) {
            if (action) action();
        } else {
            console.log("Auth required. Opening overlay.");
            if (action) setPendingAction(() => action);
            setIsOverlayOpen(true);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            showAuthOverlay,
            hideAuthOverlay,
            requireAuth,
            login,
            logout,
            theme
        }}>
            {children}
            {isOverlayOpen && <AuthOverlayUI theme={theme} onClose={hideAuthOverlay} modeProp="signin" />}
        </AuthContext.Provider>
    );
}

// --- Internal UI Component ---

function AuthOverlayUI({ theme, onClose, modeProp }: { theme: 'light' | 'dark', onClose: () => void, modeProp: AuthMode }) {
    const { login } = useAuth();
    const [mode, setMode] = useState<AuthMode>(modeProp);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const isDark = theme === 'dark';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            if (mode === 'signup') {
                // Validate passwords match
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match.");
                }

                // Call register.php
                const formDataObj = new FormData();
                formDataObj.append('name', formData.name);
                formDataObj.append('email', formData.email);
                formDataObj.append('password', formData.password);

                const res = await fetch("http://localhost:8080/campus-navigator-backend/register.php", {
                    method: "POST",
                    body: formDataObj,
                    credentials: "include"
                });

                const data = await res.json();

                console.log("Signup response:", data);

                if (data.status === "success") {
                    console.log("Signup successful, showing success message and scheduling redirect");
                    // Registration successful, switch to sign-in mode
                    setSuccess("Account created successfully! Please sign in.");
                    setIsSubmitting(false);
                    // Clear form and switch to signin after a brief delay
                    setTimeout(() => {
                        console.log("Switching to signin mode now");
                        setMode('signin');
                        setFormData({
                            name: "",
                            email: formData.email, // Keep email for convenience
                            password: "",
                            confirmPassword: ""
                        });
                        setSuccess(null);
                    }, 2000);
                    return; // Important: exit here to prevent further execution
                } else if (res.status === 409 || data.status === "error") {
                    // User already exists or other error
                    throw new Error(data.message || "Registration failed");
                } else {
                    throw new Error(data.message || "Registration failed");
                }
            } else {
                // Sign in mode
                console.log("Attempting login...");
                await login({
                    email: formData.email,
                    password: formData.password
                });
                console.log("Login successful, showing success message");
                // Show success message briefly before closing
                setSuccess("Successfully signed in!");
                setIsSubmitting(false);
                setTimeout(() => {
                    console.log("Closing overlay now");
                    onClose();
                }, 1500);
            }
        } catch (err: any) {
            let message = err.message || "Authentication failed";

            // Check for network errors or account not found
            if (err.name === 'TypeError' && message.toLowerCase().includes('fetch')) {
                message = "Account not found. Please create an account first.";
            }
            // Check for common backend error messages indicating user doesn't exist
            else if (
                message.toLowerCase().includes("user not found") ||
                message.toLowerCase().includes("no account found") ||
                message.toLowerCase().includes("email not found") ||
                message.toLowerCase().includes("account does not exist")
            ) {
                message = "Account not found. Please register first to continue.";
            }

            setError(message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`
                relative w-full max-w-[95vw] sm:max-w-md rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden 
                animate-in zoom-in-95 duration-300 border flex flex-col transition-colors duration-500
                max-h-[90vh] overflow-y-auto
                ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}
            `}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`
                        absolute top-6 right-6 z-10 w-10 h-10 rounded-2xl flex items-center justify-center 
                        transition-all active:scale-90
                        ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-900'}
                    `}
                >
                    <X size={20} />
                </button>

                <div className="p-6 sm:p-8 flex flex-col items-center">
                    {/* Icon Header */}
                    <div className={`
                        w-20 h-20 rounded-3xl mb-6 flex items-center justify-center shadow-lg transform rotate-3
                        ${isDark ? 'bg-slate-800 text-orange-500' : 'bg-orange-50 text-orange-500'}
                    `}>
                        <User size={32} strokeWidth={2.5} />
                    </div>

                    <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className={`text-center mb-8 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {mode === 'signin'
                            ? 'Sign in to access your saved places and preferences.'
                            : 'Join MCC Navigator to sync your campus experience.'}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 w-full bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-semibold text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 w-full bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-semibold text-center animate-in fade-in slide-in-from-top-2">
                            {success}
                        </div>
                    )}


                    <form onSubmit={handleSubmit} className="w-full space-y-4">

                        {mode === 'signup' && (
                            <div className="space-y-1">
                                <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                                <div className={`flex items-center px-4 h-12 rounded-xl border transition-all focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                    <User size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="flex-1 bg-transparent border-none outline-none ml-3 font-semibold placeholder:font-normal"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
                            <div className={`flex items-center px-4 h-12 rounded-xl border transition-all focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                <Mail size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                <input
                                    type="email"
                                    required
                                    placeholder="student@mcc.edu.in"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="flex-1 bg-transparent border-none outline-none ml-3 font-semibold placeholder:font-normal"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
                            <div className={`flex items-center px-4 h-12 rounded-xl border transition-all focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                <Lock size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="flex-1 bg-transparent border-none outline-none ml-3 font-semibold placeholder:font-normal"
                                />
                            </div>
                        </div>

                        {mode === 'signup' && (
                            <div className="space-y-1">
                                <label className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Confirm Password</label>
                                <div className={`flex items-center px-4 h-12 rounded-xl border transition-all focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                                    <Lock size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="flex-1 bg-transparent border-none outline-none ml-3 font-semibold placeholder:font-normal"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`
                                w-full h-14 rounded-2xl font-black text-[15px] shadow-xl transition-all active:scale-[0.98] 
                                flex items-center justify-center gap-2 mt-6
                                ${isDark
                                    ? 'bg-orange-500 text-white hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-500'
                                    : 'bg-[#111827] text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400'}
                            `}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                    </form>

                    <div className="mt-6 flex items-center gap-2 justify-center flex-wrap">
                        <span className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                        </span>
                        <button
                            onClick={() => {
                                setMode(mode === 'signin' ? 'signup' : 'signin');
                                setError(null);
                                setSuccess(null);
                            }}
                            className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors"
                        >
                            {mode === 'signin' ? "Sign Up" : "Sign In"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
