"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
    LayoutGrid, 
    Users, 
    Shield, 
    GraduationCap, 
    Search, 
    LogOut, 
    Loader2, 
    Calendar,
    Settings,
    Bell
} from "lucide-react";
import { SidebarItem } from "./components/AdminComponents";

// Context for sharing user data/stats across admin pages
const AdminContext = createContext<{
    users: any[];
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    stats: { total: number; admins: number; events: number };
}>({
    users: [],
    loading: true,
    searchTerm: "",
    setSearchTerm: () => {},
    stats: { total: 0, admins: 0, events: 12 }
});

export const useAdmin = () => useContext(AdminContext);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // 🔐 Admin Check Logic
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const res = await fetch(
                    "http://localhost:8080/campus-navigator-backend/check-admin.php",
                    { credentials: "include" }
                );
                if (!res.ok) { router.push("/"); return; }
                const data = await res.json();
                if (data.status !== "success") {
                    router.push("/");
                } else {
                    fetchUsers();
                }
            } catch (err) {
                console.error("Admin check failed");
                router.push("/");
            } finally {
                setLoading(false);
            }
        };
        checkAdmin();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(
                "http://localhost:8080/campus-navigator-backend/getUsers.php",
                { credentials: "include" }
            );
            const data = await res.json();
            if (data.status === "success") {
                setUsers(data.users);
            }
        } catch (err) {
            console.error("Fetch users error:", err);
        }
    };

    const stats = React.useMemo(() => ({
        total: users.length,
        admins: users.filter((u: any) => u.role?.toLowerCase() === 'admin').length,
        events: 12
    }), [users]);

    const handleLogout = () => router.push("/");

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] space-y-4">
                <Loader2 className="w-12 h-12 text-[#111827] animate-spin" />
                <p className="text-[#111827] font-bold text-xl tracking-tight">Accessing Admin Control...</p>
            </div>
        );
    }

    return (
        <AdminContext.Provider value={{ users, loading, searchTerm, setSearchTerm, stats }}>
            <div className="flex min-h-screen bg-[#f8fafc] font-sans overflow-hidden">
                {/* 1. SIDEBAR */}
                <aside className="w-[280px] bg-[#111827] text-white flex flex-col h-screen sticky top-0 flex-shrink-0 z-40 overflow-hidden">
                    <div className="p-8 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                <GraduationCap className="text-[#111827]" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tighter leading-none">Navigator</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Admin Panel</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 flex flex-col gap-2 mt-4 ml-6">
                        <SidebarItem icon={<LayoutGrid size={20} />} label="Dashboard" href="/admin" />
                        <SidebarItem icon={<Users size={20} />} label="User Info" href="/admin/users" />
                        <SidebarItem icon={<Calendar size={20} />} label="Events" href="/admin/events" />
                        <SidebarItem icon={<Settings size={20} />} label="System Settings" href="/admin/settings" />
                    </nav>

                    <div className="p-8 border-t border-white/5">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <p className="text-xs text-gray-400 font-medium mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-sm font-bold">Online</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* 2. MAIN CONTENT AREA */}
                <main className="flex-1 h-screen flex flex-col overflow-hidden">
                    <header className="px-12 py-8 flex-shrink-0 flex items-center justify-between gap-12 bg-[#f8fafc] z-20">
                        <div className="flex-1">
                        {pathname === '/admin/users' ? (
                            <div className="flex-1 max-w-xl relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#111827] transition-colors" size={22} />
                                <input 
                                    type="text"
                                    placeholder="Search emails or names..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border-none py-4 pl-16 pr-8 rounded-[24px] shadow-sm focus:ring-4 focus:ring-[#111827]/5 transition-all text-base font-medium placeholder:text-gray-300"
                                />
                            </div>
                        ) : pathname === '/admin/events' ? (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h1 className="text-4xl font-black text-[#111827] tracking-tighter leading-none">Events Management</h1>
                                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">Campus Activities & Scheduling</p>
                            </div>
                        ) : pathname === '/admin' ? (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h1 className="text-4xl font-black text-[#111827] tracking-tighter leading-none">Dashboard Overview</h1>
                                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">Analytical Insights & Real-time Statistics</p>
                            </div>
                        ) : (
                            <div className="h-16" />
                        )}
                    </div>

                        <div className="flex items-center gap-8">
                            <div className="text-right hidden sm:block">
                                <p className="text-base font-black text-[#111827] leading-none uppercase tracking-tight">System Admin</p>
                                <p className="text-xs text-gray-400 font-bold mt-1.5 uppercase tracking-wider">Full Access Control</p>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="bg-white p-4 rounded-[20px] shadow-sm text-gray-300 hover:text-red-500 hover:shadow-md transition-all active:scale-95 border border-gray-50 hover:border-red-50"
                            >
                                <LogOut size={24} />
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 px-12 py-8 overflow-y-auto">
                        {children}
                    </div>
                </main>
            </div>
        </AdminContext.Provider>
    );
}
