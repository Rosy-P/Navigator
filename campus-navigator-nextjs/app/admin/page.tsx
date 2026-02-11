"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem("role");

        if (role !== "admin") {
            router.push("/");
        }
    }, []);

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-4">Welcome Admin 👑</p>
        </div>
    );
}
