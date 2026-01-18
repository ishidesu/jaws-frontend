"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAsset } from "../utils/assets";
import { registerUserSmart, sendOTPWithFallback, registerUser } from "../lib/auth";

export default function Register() {
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        otp: ""
    });
    const [loading, setLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [error, setError] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpMessage, setOtpMessage] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [useRegularSignup, setUseRegularSignup] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(""); // Clear error when user types
    };

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOTP = async () => {
        if (!formData.email) {
            setError("Please enter your email first");
            return;
        }

        setOtpLoading(true);
        setError("");
        setOtpMessage("");

        try {
            const result = await sendOTPWithFallback(formData.email);
            
            if (result.success) {
                setOtpSent(true);
                setOtpMessage("OTP sent to your email! Check your inbox.");
                startCountdown();
            } else if ('fallbackToRegular' in result && result.fallbackToRegular) {
                setUseRegularSignup(true);
                setError("OTP not configured. You can register without email verification.");
            } else {
                setError(result.error || "Failed to send OTP");
            }
        } catch (error: any) {
            setError(error.message || "Failed to send OTP");
            setUseRegularSignup(true);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.email || !formData.username || !formData.password) {
            setError("All fields are required");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        if (otpSent && !useRegularSignup) {
            if (!formData.otp || formData.otp.trim().length < 6) {
                setError("Please enter the verification code from your email");
                setLoading(false);
                return;
            }
        }

        try {
            let result;
            
            if (useRegularSignup || !otpSent) {
                result = await registerUser(formData);
            } else {
                result = await registerUserSmart(formData);
            }
            
            if (result.success) {
                router.push("/login?message=Registration successful! Please login.");
            } else {
                setError(result.error || "Registration failed");
            }
        } catch (error: any) {
            setError(error.message || "An unexpected error occurred");
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

            {/* Register Box Tengah */}
            <div className="flex items-center justify-center min-h-[calc(100vh-96px)] px-4">
                <div className="flex flex-col items-center w-full max-w-md">

                    {/* Judul */}
                    <h1 className="text-white text-7xl font-bold tracking-wide text-center">
                        JAWS
                    </h1>
                    <h2 className="text-white text-4xl tracking-wide mb-10 text-center">
                        CUSTOM.
                    </h2>

                    {/* Error Message */}
                    {error && (
                        <div className="w-full mb-4 p-3 bg-red-500/20 border border-red-500 rounded-md">
                            <p className="text-red-200 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* OTP Success Message */}
                    {otpMessage && (
                        <div className="w-full mb-4 p-3 bg-green-500/20 border border-green-500 rounded-md">
                            <p className="text-green-200 text-sm text-center">{otpMessage}</p>
                        </div>
                    )}

                    {/* Regular Signup Message */}
                    {useRegularSignup && (
                        <div className="w-full mb-4 p-3 bg-blue-500/20 border border-blue-500 rounded-md">
                            <p className="text-blue-200 text-sm text-center">
                                Using regular signup (no email verification required)
                            </p>
                        </div>
                    )}

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-4">
                        {/* Email with Send OTP Button */}
                        {!useRegularSignup && (
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading || otpLoading}
                                    className="flex-1 px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={loading || otpLoading || !formData.email || countdown > 0}
                                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                                >
                                    {otpLoading ? "Sending..." : countdown > 0 ? `Wait ${countdown}s` : "Send Code"}
                                </button>
                            </div>
                        )}

                        {/* Regular Email Input */}
                        {useRegularSignup && (
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none disabled:opacity-50"
                            />
                        )}

                        {/* Verification Code Field */}
                        {otpSent && !useRegularSignup && (
                            <div className="space-y-2">
                                <label className="block text-white text-sm text-center">
                                    Enter verification code from your email
                                </label>
                                <input
                                    type="text"
                                    name="otp"
                                    placeholder="Paste the full verification code from email"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none disabled:opacity-50 text-sm"
                                />
                                <p className="text-xs text-white/60 text-center">
                                    Copy the entire verification code from your email
                                </p>
                                <div className="flex justify-between text-sm">
                                    {countdown === 0 && (
                                        <button
                                            type="button"
                                            onClick={handleSendOTP}
                                            disabled={otpLoading}
                                            className="text-blue-300 hover:text-blue-200 underline"
                                        >
                                            Resend verification email
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none disabled:opacity-50"
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password (min 6 characters)"
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
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    {/* Info Text */}
                    {!otpSent && !useRegularSignup && (
                        <div className="mt-4 text-center">
                            <p className="text-xs text-white/60 max-w-xs mb-2">
                                Click "Send Code" for email verification
                            </p>
                        </div>
                    )}

                    {/* Login Link */}
                    <Link href="/login">
                        <p className="mt-4 text-sm text-white/80 hover:text-white cursor-pointer">
                            Log into an Existing Account
                        </p>
                    </Link>
                </div>
            </div>

        </div>
    );
}
