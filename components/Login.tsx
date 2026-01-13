"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAsset } from "../utils/assets";
import { loginUser } from "../lib/auth";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const urlMessage = searchParams.get('message');
        if (urlMessage) {
            setMessage(urlMessage);
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        if (!formData.email || !formData.password) {
            setError("Email and password are required");
            setLoading(false);
            return;
        }

        try {
            const result = await loginUser(formData);
            
            if (result.success) {
                // Wait a bit before refreshing user to avoid race conditions
                await new Promise(resolve => setTimeout(resolve, 500));
                await refreshUser();
                router.push("/");
            } else {
                setError(result.error || "Login failed");
            }
        } catch (error: any) {
            // Handle AbortError specifically
            if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
                setError("Login request was cancelled. Please try again.");
            } else {
                setError(error.message || "An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen">

            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="relative w-full h-full">
                    <Image
                        src={getAsset("assets/login/login-bgimage.jpg")}
                        alt="Background"
                        fill
                        className="object-cover"
                    />
                </div>
            </div>

            {/* Overlay gelap */}
            <div className="absolute inset-0 bg-black/60 -z-10" />

            {/* Top Bar */}
            <div className="bg-black/70 text-white py-4 px-6 shadow-lg flex items-center">
                <Link href="/">
                    <Image
                        className="w-20 h-16 cursor-pointer"
                        src={getAsset("assets/Jaws-logo.png")}
                        alt="Jaws Logo"
                        width={80}
                        height={64}
                    />
                </Link>
            </div>

            {/* Login Box Tengah */}
            <div className="flex items-center justify-center min-h-[calc(100vh-96px)] px-4">
                <div className="flex flex-col items-center w-full max-w-md">

                    {/* Judul */}
                    <h1 className="text-white text-7xl font-bold tracking-wide text-center">
                        JAWS
                    </h1>
                    <h2 className="text-white text-4xl tracking-wide mb-10 text-center">
                        CUSTOM.
                    </h2>

                    {/* Success Message */}
                    {message && (
                        <div className="w-full mb-4 p-3 bg-green-500/20 border border-green-500 rounded-md">
                            <p className="text-green-200 text-sm text-center">{message}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="w-full mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md">
                            <p className="text-red-200 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-4">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none disabled:opacity-50"
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none disabled:opacity-50"
                        />

                        {/* Button */}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="mt-6 w-auto pl-5 pr-5 py-3 bg-gray-300 hover:bg-gray-400 text-black rounded-full transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    {/* Register Link */}
                    <Link href="/register" className="mt-4 text-sm text-white/80 hover:text-white cursor-pointer">
                        Create a New account.
                    </Link>

                    {/* Crew Link */}
                    {/* <Link href="/crewlogin" className="mt-4 text-sm text-white/80 hover:text-white cursor-pointer">
                        Login with Crew account.
                    </Link> */}
                </div>
            </div>

        </div>
    );
}
