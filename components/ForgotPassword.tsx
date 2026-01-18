"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getAsset } from "../utils/assets";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        if (!email) {
            setError("Email is required");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSuccess(true);
            setEmail("");
        } catch (error: any) {
            setError(error.message || "Failed to send reset email");
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

            {/* Forgot Password Box */}
            <div className="flex items-center justify-center min-h-[calc(100vh-96px)] px-4">
                <div className="flex flex-col items-center w-full max-w-md">

                    {/* Judul */}
                    <h1 className="text-white text-5xl font-bold tracking-wide text-center mb-2">
                        FORGOT PASSWORD
                    </h1>
                    <p className="text-white/80 text-sm text-center mb-10">
                        Enter your email to receive a password reset link
                    </p>

                    {/* Success Message */}
                    {success && (
                        <div className="w-full mb-4 p-4 bg-green-500/20 border border-green-500 rounded-md">
                            <p className="text-green-200 text-sm text-center">
                                Password reset link has been sent to your email. Please check your inbox.
                            </p>
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none disabled:opacity-50"
                        />

                        {/* Button */}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="mt-6 w-auto pl-5 pr-5 py-3 bg-gray-300 hover:bg-gray-400 text-black rounded-full transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <Link href="/login" className="mt-4 text-sm text-white/80 hover:text-white cursor-pointer">
                        Back to Login
                    </Link>
                </div>
            </div>

        </div>
    );
}
