"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('The reset token is invalid or missing in the URL payload.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (password !== confirmPassword) {
            setError('Passwords do not match. Please verify.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be securely set to at least 6 characters.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/resetPassword.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();

            if (data.status === 'success') {
                setSuccess(true);
                // Force user back to login protocol after securely asserting logic
                setTimeout(() => router.push('/'), 3000);
            } else {
                setError(data.message || 'An error occurred parsing the reset token.');
            }
        } catch (err) {
            setError('Failed to establish a secure connection to standard server APIs.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                    <Lock size={24} />
                </div>

                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Create New Password</h1>
                
                {success ? (
                    <div className="space-y-4 text-center py-6 animate-in zoom-in-95 duration-500">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Security Complete</h2>
                        <p className="text-slate-500 text-sm font-medium mb-6">Your password has been successfully updated. Redirecting in 3 seconds...</p>
                        <Link href="/" className="inline-block px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all hover:bg-black w-full">
                            Launch Login
                        </Link>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <p className="text-slate-500 text-sm font-medium mb-8">Please enter and confirm your secure new password credentials below.</p>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                />
                            </div>
                            
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Verify new password"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                />
                            </div>
                            
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl mt-2 animate-in slide-in-from-left-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <p className="text-[12px] font-bold">{error}</p>
                                </div>
                            )}
                            
                            <button
                                type="submit"
                                disabled={isLoading || !token}
                                className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex justify-center items-center shadow-lg shadow-emerald-600/20 mt-6"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Reset Password'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
