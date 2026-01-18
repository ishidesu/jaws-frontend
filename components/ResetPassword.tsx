"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAsset } from "../utils/assets";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if we have a valid session from the reset link
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setError("Invalid or expired reset link. Please request a new one.");
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent double submission
        if (loading || success) return;
        
        setLoading(true);
        setError("");
        setSuccess(false);

        if (!password || !confirmPassword) {
            setError("Both password fields are required");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            console.log('Starting password update...');
            
            const { data, error } = await supabase.auth.updateUser({
                password: password
            });

            console.log('Update result:', { data, error });

            if (error) {
                console.error('Update error:', error);
                setError(error.message || "Failed to reset password");
                setLoading(false);
                return;
            }

            console.log('Password updated successfully');
            
            // Set success first, then loading false
            setSuccess(true);
            setLoading(false);
            
            // Clear form
            setPassword("");
            setConfirmPassword("");
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                console.log('Redirecting to login...');
                window.location.href = "/login?message=Password reset successful. Please login with your new password.";
            }, 2000);
        } catch (error: any) {
            console.error('Catch error:', error);
            setError(error.message || "Failed to reset password");
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

            {/* Reset Password Box */}
            <div className="flex items-center justify-center min-h-[calc(100vh-96px)] px-4">
                <div className="flex flex-col items-center w-full max-w-md">

                    {/* Judul */}
                    <h1 className="text-white text-5xl font-bold tracking-wide text-center mb-2">
                        RESET PASSWORD
                    </h1>
                    <p className="text-white/80 text-sm text-center mb-10">
                        Enter your new password
                    </p>

                    {/* Success Message */}
                    {success && (
                        <div className="w-full mb-4 p-4 bg-green-500/20 border border-green-500 rounded-md">
                            <p className="text-green-200 text-sm text-center">
                                Password reset successful! Redirecting to login...
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
                            type="password"
                            name="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none disabled:opacity-50"
                        />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none disabled:opacity-50"
                        />

                        {/* Button */}
                        <button 
                            type="submit"
                            disabled={loading || success}
                            className="mt-6 w-auto pl-5 pr-5 py-3 bg-gray-300 hover:bg-gray-400 text-black rounded-full transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {success ? "Success! Redirecting..." : loading ? "Resetting..." : "Reset Password"}
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
