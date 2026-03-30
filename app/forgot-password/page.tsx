"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [demoLink, setDemoLink] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:8080/campus-navigator-backend/forgotPassword.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            // Succeed based on successful dispatch (generic UI mask check)
            if (data.status === 'success') {
                setSuccess(true);
                if (data.demo_link) setDemoLink(data.demo_link);
            } else {
                setError(data.message || 'An error occurred processing the request.');
            }
        } catch (err) {
            setError('Failed to securely contact the server. Check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 relative">
                <button 
                    onClick={() => router.back()} 
                    className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"
                    title="Go Back"
                >
                    <ArrowLeft size={20} />
                </button>
                
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                    <Mail size={24} />
                </div>

                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Password Reset</h1>
                
                {success ? (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl flex items-start gap-3 border border-emerald-100">
                            <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-500" size={20} />
                            <p className="text-sm font-medium">If an account exists with that email, a secure reset link has been dispatched.</p>
                        </div>

                        {/* DEMO DISPLAY LOGIC */}
                        {demoLink && (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Simulated Demo Link</p>
                                <a href={demoLink} className="text-xs font-bold text-blue-500 hover:text-blue-700 underline underline-offset-4 break-all block">
                                    {demoLink}
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <p className="text-slate-500 text-sm font-medium mb-8">Enter the email address associated with your account and we'll send you a link to reset your password.</p>
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your-email@example.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                />
                            </div>
                            
                            {error && <p className="text-rose-500 text-[13px] font-bold pl-1 animate-in slide-in-from-left-1">{error}</p>}
                            
                            <button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex justify-center items-center shadow-lg shadow-slate-900/20"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Dispatch Reset Email'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
