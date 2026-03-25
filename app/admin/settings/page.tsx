"use client";

import React, { useState, useEffect } from "react";
import {
    User,
    Lock,
    MapPin,
    Activity,
    Info,
    Save,
    Key,
    Users,
    Map,
    Calendar,
    Eye,
    EyeOff,
    Shield,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { useAdmin } from "../layout";

export default function SettingsPage() {
    const { stats: ctxStats } = useAdmin();

    // States for Profile
    const [profile, setProfile] = useState({ name: "", email: "" });
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileUpdating, setProfileUpdating] = useState(false);

    // States for Security
    const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordUpdating, setPasswordUpdating] = useState(false);

    // States for Navigation
    const [navSettings, setNavSettings] = useState({ default_location: "Main Gate", default_zoom: 17 });
    const [navLoading, setNavLoading] = useState(true);
    const [navUpdating, setNavUpdating] = useState(false);

    // System Stats
    const [systemStats, setSystemStats] = useState({ users: 0, events: 0, locations: 0 });

    // Feedback
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Profile
                const profileRes = await fetch("http://localhost:80/campus-navigator-backend/get-admin-profile.php", { credentials: "include" });
                const profileData = await profileRes.json();
                console.log("Profile Data:", profileData);
                if (profileData.status === "success") {
                    setProfile({ name: profileData.admin.name, email: profileData.admin.email });
                } else {
                    console.warn("Profile fetch error:", profileData.message);
                }

                // Fetch System Settings & Stats
                const settingsRes = await fetch("http://localhost:80/campus-navigator-backend/get-system-settings.php", { credentials: "include" });
                const settingsData = await settingsRes.json();
                console.log("Settings/Stats Data:", settingsData);
                if (settingsData.status === "success") {
                    setNavSettings(settingsData.settings);
                    setSystemStats(settingsData.stats);
                } else {
                    console.warn("Settings fetch error:", settingsData.message);
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                showMessage('error', "Could not connect to backend");
            } finally {
                setProfileLoading(false);
                setNavLoading(false);
            }
        }
        fetchData();
    }, []);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileUpdating(true);
        try {
            const res = await fetch("http://localhost:80/campus-navigator-backend/update-admin-profile.php", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile)
            });
            const data = await res.json();
            if (data.status === "success") {
                showMessage('success', "Profile updated successfully!");
                // Update local storage to match (layout.tsx uses it)
                localStorage.setItem("user_name", profile.name);
            } else {
                showMessage('error', data.message || "Update failed");
            }
        } catch (e) {
            showMessage('error', "Network error occurred");
        } finally {
            setProfileUpdating(false);
        }
    };

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            showMessage('error', "New passwords do not match!");
            return;
        }
        if (passwords.new.length < 6) {
            showMessage('error', "Password must be at least 6 characters!");
            return;
        }

        setPasswordUpdating(true);
        try {
            const res = await fetch("http://localhost:80/campus-navigator-backend/change-password.php", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword: passwords.old, newPassword: passwords.new })
            });
            const data = await res.json();
            if (data.status === "success") {
                showMessage('success', "Password changed successfully!");
                setPasswords({ old: "", new: "", confirm: "" });
            } else {
                showMessage('error', data.message || "Failed to change password");
            }
        } catch (e) {
            showMessage('error', "Network error occurred");
        } finally {
            setPasswordUpdating(false);
        }
    };

    const handleSaveNavSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setNavUpdating(true);
        try {
            const res = await fetch("http://localhost:80/campus-navigator-backend/update-system-settings.php", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(navSettings)
            });
            const data = await res.json();
            if (data.status === "success") {
                showMessage('success', "Settings saved!");
            } else {
                showMessage('error', data.message || "Save failed");
            }
        } catch (e) {
            showMessage('error', "Network error occurred");
        } finally {
            setNavUpdating(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 relative">

            {/* Notification Toast */}
            {message && (
                <div className={`fixed bottom-12 right-12 z-50 px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-4 animate-in slide-in-from-right duration-500 border
                    ${message.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <span className="font-bold tracking-tight">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section 1 – Admin Profile Settings */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#111827] tracking-tight">Admin Profile</h3>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mt-1">Manage personal account details</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6 flex-1">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Admin Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="Enter admin name"
                                className="w-full bg-gray-50 border-none py-4 px-6 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-[#111827] placeholder:text-gray-300"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                placeholder="admin@navigator.com"
                                className="w-full bg-gray-50 border-none py-4 px-6 rounded-2xl focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-[#111827] placeholder:text-gray-300"
                                required
                            />
                        </div>
                        <button
                            disabled={profileUpdating}
                            type="submit"
                            className="mt-6 w-full py-5 bg-[#111827] hover:bg-black disabled:bg-gray-200 rounded-2xl text-xs font-black text-white transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {profileUpdating ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Update Profile
                        </button>
                    </form>
                </div>

                {/* Section 2 – Change Password */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#111827] tracking-tight">Security Settings</h3>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mt-1">Update authentication credentials</p>
                        </div>
                    </div>

                    <form onSubmit={handleSavePassword} className="space-y-6 flex-1">
                        <div className="space-y-2 relative">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Old Password</label>
                            <div className="relative">
                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwords.old}
                                    onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50 border-none py-4 pl-14 pr-6 rounded-2xl focus:ring-4 focus:ring-rose-50 transition-all font-medium text-[#111827] placeholder:text-gray-300"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                            <div className="relative">
                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                    className="w-full bg-gray-50 border-none py-4 pl-14 pr-12 rounded-2xl focus:ring-4 focus:ring-rose-50 transition-all font-medium text-[#111827] placeholder:text-gray-300"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                            <div className="relative">
                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                    placeholder="Confirm new password"
                                    className="w-full bg-gray-50 border-none py-4 pl-14 pr-6 rounded-2xl focus:ring-4 focus:ring-rose-50 transition-all font-medium text-[#111827] placeholder:text-gray-300"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            disabled={passwordUpdating}
                            type="submit"
                            className="mt-6 w-full py-5 bg-[#111827] hover:bg-black disabled:bg-gray-200 rounded-2xl text-xs font-black text-white transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {passwordUpdating ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
                            Save Password
                        </button>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Section 3 – Navigation Settings */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col lg:col-span-2">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#111827] tracking-tight">Navigation Settings</h3>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mt-1">Configure map defaults</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveNavSettings} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Default Start Location</label>
                                <select
                                    value={navSettings.default_location}
                                    onChange={(e) => setNavSettings({ ...navSettings, default_location: e.target.value })}
                                    className="w-full bg-gray-50 border-none py-4 px-6 rounded-2xl focus:ring-4 focus:ring-amber-50 transition-all font-medium text-[#111827] appearance-none cursor-pointer"
                                >
                                    <option>Main Gate</option>
                                    <option>Academic Building</option>
                                    <option>Auditorium</option>
                                    <option>Library</option>
                                    <option>Hostel Block</option>
                                    <option>Sports Complex</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Default Map Zoom</label>
                                <input
                                    type="number"
                                    value={navSettings.default_zoom}
                                    onChange={(e) => setNavSettings({ ...navSettings, default_zoom: parseInt(e.target.value) })}
                                    className="w-full bg-gray-50 border-none py-4 px-6 rounded-2xl focus:ring-4 focus:ring-amber-50 transition-all font-medium text-[#111827]"
                                    min="10"
                                    max="22"
                                />
                            </div>
                        </div>

                        <button
                            disabled={navUpdating}
                            type="submit"
                            className="w-max px-12 py-5 bg-[#111827] hover:bg-black disabled:bg-gray-200 rounded-2xl text-xs font-black text-white transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {navUpdating ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Settings
                        </button>
                    </form>
                </div>

                {/* Section 5 – System Information */}
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <Info size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#111827] tracking-tight">System Information</h3>
                            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mt-1">Version & Core Details</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center py-4 border-b border-gray-50">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Project Name</span>
                            <span className="text-sm font-bold text-[#111827]">Campus Navigator</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-gray-50">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Build Version</span>
                            <span className="text-sm font-bold text-[#111827]">1.0.8-rev4</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-gray-50">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Developer</span>
                            <span className="text-sm font-bold text-[#111827]">Rosy</span>
                        </div>
                        <div className="flex justify-between items-center py-4">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Environment</span>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase">Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4 – System Statistics */}
            <div className="bg-white p-10 rounded-[44px] shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[#111827] tracking-tight">System Statistics</h3>
                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mt-1">Live platform metrics</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-indigo-50/50 p-8 rounded-[32px] border border-indigo-100 group hover:scale-[1.02] transition-all">
                        <Users className="text-indigo-600 mb-4" size={24} />
                        <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Total Users</p>
                        <p className="text-4xl font-black text-indigo-900">{systemStats.users}</p>
                    </div>
                    <div className="bg-emerald-50/50 p-8 rounded-[32px] border border-emerald-100 group hover:scale-[1.02] transition-all">
                        <Map className="text-emerald-600 mb-4" size={24} />
                        <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Total Locations</p>
                        <p className="text-4xl font-black text-emerald-900">{systemStats.locations}</p>
                    </div>
                    <div className="bg-amber-50/50 p-8 rounded-[32px] border border-amber-100 group hover:scale-[1.02] transition-all">
                        <Calendar className="text-amber-600 mb-4" size={24} />
                        <p className="text-[11px] font-black text-amber-400 uppercase tracking-[0.2em] mb-1">Total Events</p>
                        <p className="text-4xl font-black text-amber-900">{systemStats.events}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
