"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { logoutUser } from "../lib/auth";
import { getAsset } from "../utils/assets";

export default function Navbar() {
    const { user, loading, refreshUser } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        try {
            const result = await logoutUser();
            if (result.success) {
                await refreshUser();
                setShowDropdown(false);
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <nav className="w-full bg-black text-white py-4 px-6 flex items-center justify-between shadow-lg">
            {/* Logo */}
            <div className="flex items-center space-x-3 tracking-wide">
                <Image
                    className="relative w-20 h-16"
                    src={getAsset("assets/Jaws-logo.png")}
                    alt="Jaws Logo"
                    width={80}
                    height={64}
                />

                {/* Menu */}
                <ul className="hidden md:flex space-x-10 text-lg">
                    <li>
                        <Link href="/" className="hover:text-gray-300 transition pl-20">HOME</Link>
                    </li>
                    <li>
                        <Link href="/catalog" className="hover:text-gray-300 transition">CATALOG</Link>
                    </li>
                    <li>
                        <Link href="/contact" className="hover:text-gray-300 transition">CONTACT</Link>
                    </li>
                </ul>
            </div>

            {/* Login/User Info */}
            <div className="flex items-center space-x-4">
                {loading ? (
                    <div className="text-gray-400">Loading...</div>
                ) : user ? (
                    <div className="relative" ref={dropdownRef}>
                        {/* User Avatar/Name Button */}
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center space-x-3 hover:text-gray-300 transition focus:outline-none"
                        >
                            {/* User Avatar */}
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold">
                                    {user.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            
                            {/* Username */}
                            <div className="text-left">
                                <div className="text-lg font-medium tracking-wide">
                                    {user.username.toUpperCase()}
                                </div>
                                {user.role === 'admin' && (
                                    <div className="text-xs text-red-400">ADMIN</div>
                                )}
                            </div>
                            
                            {/* Dropdown Arrow */}
                            <svg 
                                className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 py-2">
                                {/* User Info Header */}
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <div className="text-black font-semibold text-lg">
                                        {user.username.toUpperCase()}
                                    </div>
                                    <div className="text-gray-600 text-sm">{user.email}</div>
                                    {user.role === 'admin' && (
                                        <div className="text-red-600 text-xs font-medium mt-1">ADMINISTRATOR</div>
                                    )}
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <Link 
                                        href="/profile/purchases"
                                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        Pembelian
                                    </Link>
                                    <Link 
                                        href="/profile/cart"
                                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        Keranjang
                                    </Link>
                                    <Link 
                                        href="/profile/wishlist"
                                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        Wishlist
                                    </Link>
                                    <Link 
                                        href="/profile/settings"
                                        className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        Pengaturan
                                    </Link>
                                    
                                    {/* Admin Only Menu */}
                                    {user.role === 'admin' && (
                                        <>
                                            <div className="border-t border-gray-200 my-2"></div>
                                            <Link 
                                                href="/admin/crew-home"
                                                className="block px-4 py-3 text-red-600 hover:bg-red-50 transition font-medium"
                                                onClick={() => setShowDropdown(false)}
                                            >
                                                Crew Home
                                            </Link>
                                        </>
                                    )}
                                </div>

                                {/* Logout */}
                                <div className="border-t border-gray-200 pt-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition flex items-center justify-between"
                                    >
                                        <span>Log out</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link href="/login" className="hover:text-gray-300 transition pr-20 text-lg tracking-wide">
                        LOGIN
                    </Link>
                )}
            </div>
        </nav>
    );
}