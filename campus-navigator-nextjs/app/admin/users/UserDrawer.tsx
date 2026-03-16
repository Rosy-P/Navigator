"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, ShieldAlert, UserCog, Ban, Trash2, Calendar, Fingerprint, Loader2, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { User } from "./page";

interface Props {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    refreshUsers: () => void;
}

export default function UserDrawer({ user, isOpen, onClose, refreshUsers }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"details" | "activity">("details");

    useEffect(() => {
        const fetchCurrentAdmin = async () => {
            try {
                const res = await fetch("http://localhost:80/campus-navigator-backend/check-admin.php", { credentials: "include" });
                const data = await res.json();
                if (data.status === "success") {
                    setCurrentAdminId(data.user_id);
                }
            } catch (err) {
                console.error("Failed to fetch admin info", err);
            }
        };
        if (isOpen) fetchCurrentAdmin();
    }, [isOpen]);

    if (!user) return null;

    const isSelf = user.id === currentAdminId;

    const handleAction = async (endpoint: string, body: any) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`http://localhost:80/campus-navigator-backend/${endpoint}`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.status === "success") {
                refreshUsers();
            } else {
                alert(data.message || "Action failed");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        setIsDeleting(true);
        try {
            const res = await fetch("http://localhost:80/campus-navigator-backend/delete-user.php", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id }),
            });
            const data = await res.json();
            if (data.status === "success") {
                refreshUsers();
                onClose();
            } else {
                alert(data.message || "Delete failed");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during deletion");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed top-4 right-4 bottom-4 w-full max-w-[480px] bg-white shadow-2xl transition-all duration-500 ease-in-out z-[70] flex flex-col rounded-[32px] border border-slate-100
                ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>

                {/* Header Section (Inspired by Reference) */}
                <div className="pt-8 px-8 flex-shrink-0">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex gap-8 border-b border-slate-100 w-full">
                            <button
                                onClick={() => setActiveTab("details")}
                                className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "details" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                User Management
                                {activeTab === "details" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab("activity")}
                                className={`pb-4 text-sm font-bold transition-all relative ${activeTab === "activity" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                Activity Log
                                {activeTab === "activity" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />}
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="absolute right-6 top-6 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-900"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Account Control v1.0</h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">Modify permissions and system access for this member</p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto px-8 pb-32">
                    {activeTab === "details" ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* User Highlight Card */}
                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-2xl font-black text-indigo-600">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-lg font-bold text-slate-900 leading-none">{user.name}</h3>
                                        <div className="mb-0.5">
                                            {user.status?.toLowerCase() === 'active'
                                                ? <CheckCircle2 size={14} className="text-green-500" />
                                                : <AlertCircle size={14} className="text-red-500" />
                                            }
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">{user.email}</p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Shield size={12} className="text-indigo-500" /> Current Role
                                    </p>
                                    <p className="text-sm font-black text-slate-900 uppercase">{user.role}</p>
                                </div>
                                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Ban size={12} className="text-red-500" /> Access Status
                                    </p>
                                    <p className="text-sm font-black text-slate-900 uppercase">{user.status || 'Active'}</p>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between text-sm px-1">
                                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-300" /> Joined Platform
                                    </span>
                                    <span className="text-slate-900 font-bold">{new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm px-1">
                                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                        <Fingerprint size={14} className="text-slate-300" /> Internal Member ID
                                    </span>
                                    <span className="text-slate-500 font-mono text-xs font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">#{user.id}</span>
                                </div>
                            </div>

                            {/* Danger Zone Placeholder / Safety Warning */}
                            {isSelf && (
                                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                                        <ShieldAlert size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-amber-900 mb-1 uppercase tracking-tight">Personal Profile Protection</p>
                                        <p className="text-[11px] font-bold text-amber-700 leading-normal">
                                            This is your current active account. Management actions are restricted to prevent self-deletion or losing administrative access.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Settings Section (Dropdown style like reference) */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Account Permissions</h4>

                                <div className="space-y-3">
                                    <button
                                        disabled={isSelf || isUpdating}
                                        onClick={() => handleAction("change-role.php", {
                                            user_id: user.id,
                                            role: user.role.toLowerCase() === 'admin' ? 'student' : 'admin'
                                        })}
                                        className="w-full group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                <UserCog size={18} className="text-slate-400 group-hover:text-indigo-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-slate-900">Modify System Role</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Current: {user.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">TOGGLE</span>
                                            {isUpdating && <Loader2 size={14} className="animate-spin text-indigo-600" />}
                                        </div>
                                    </button>

                                    <button
                                        disabled={isSelf || isUpdating}
                                        onClick={() => handleAction("suspend-user.php", {
                                            user_id: user.id,
                                            status: user.status?.toLowerCase() === 'suspended' ? 'active' : 'suspended'
                                        })}
                                        className="w-full group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-orange-100 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                                                <Ban size={18} className="text-slate-400 group-hover:text-orange-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-slate-900">{user.status?.toLowerCase() === 'suspended' ? 'Restore Full Access' : 'Suspend Account'}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Current: {user.status || 'Active'}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">ACTION</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                            <Info size={48} className="text-slate-100 mb-4" />
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">History Coming Soon</h3>
                            <p className="text-xs font-medium text-slate-400 max-w-[200px]">We're building a system to track user activity and login history.</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions (Sticky bottom style) */}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 rounded-b-[32px]">
                    <button
                        disabled={isSelf || isDeleting}
                        onClick={handleDelete}
                        className="w-full px-6 py-4 rounded-2xl bg-red-600 text-white text-sm font-black hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        Delete Member
                    </button>
                </div>
            </div>
        </>
    );
}
