"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { logoutUser } from "../lib/auth";
import { getAsset } from "../utils/assets";

export default function Navbar({ crewHomeMenu }: { crewHomeMenu?: { activeRoute: string; setActiveRoute: (route: string) => void } }) {
    const { user, loading, refreshUser } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const isCrewHome = pathname === '/admin/crew-home';

    const handleLogout = async () => {
        try {
            const result = await logoutUser();
            if (result.success) {
                await refreshUser();
                setShowDropdown(false);
                setShowMobileMenu(false);
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
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (!target.closest('.hamburger-button')) {
                    setShowMobileMenu(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <nav className="w-full bg-black text-white py-4 px-4 md:px-6 shadow-lg relative">
            <div className="flex items-center justify-between">
                {/* Left Side: Hamburger + Logo */}
                <div className="flex items-center space-x-3">
                    {/* Hamburger Menu Button (Mobile Only) */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="hamburger-button md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5 focus:outline-none"
                        aria-label="Toggle menu"
                    >
                        <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${showMobileMenu ? 'rotate-45 translate-y-2' : ''}`}></span>
                        <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${showMobileMenu ? 'opacity-0' : ''}`}></span>
                        <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${showMobileMenu ? '-rotate-45 -translate-y-2' : ''}`}></span>
                    </button>

                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <Image
                            className="relative w-16 h-12 md:w-20 md:h-16"
                            src={getAsset("assets/Jaws-logo.png")}
                            alt="Jaws Logo"
                            width={80}
                            height={64}
                        />
                    </Link>

                    {/* Desktop Menu */}
                    <ul className="hidden md:flex space-x-10 text-lg ml-20">
                        <li>
                            <Link href="/" className="hover:text-gray-300 transition">HOME</Link>
                        </li>
                        <li>
                            <Link href="/catalog" className="hover:text-gray-300 transition">CATALOG</Link>
                        </li>
                        <li>
                            <Link href="/contact" className="hover:text-gray-300 transition">CONTACT</Link>
                        </li>
                    </ul>
                </div>

                {/* Right Side: Login/User Info */}
                <div className="flex items-center space-x-4">
                    {loading ? (
                        <div className="text-gray-400 text-sm md:text-base">Loading...</div>
                    ) : user ? (
                        <div className="relative" ref={dropdownRef}>
                            {/* User Avatar/Name Button */}
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center space-x-2 md:space-x-3 hover:text-gray-300 transition focus:outline-none"
                            >
                                {/* User Avatar */}
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-600 rounded-full flex items-center justify-center">
                                    <span className="text-xs md:text-sm font-semibold">
                                        {user.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                
                                {/* Username */}
                                <div className="text-left">
                                    <div className="text-sm md:text-lg font-medium tracking-wide">
                                        {user.username.toUpperCase()}
                                    </div>
                                    {user.role === 'admin' && (
                                        <div className="text-xs text-red-400">ADMIN</div>
                                    )}
                                </div>
                                
                                {/* Dropdown Arrow */}
                                <svg 
                                    className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-56 md:w-64 bg-white rounded-lg shadow-lg z-50 py-2">
                                    {/* User Info Header */}
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <div className="text-black font-semibold text-base md:text-lg">
                                            {user.username.toUpperCase()}
                                        </div>
                                        <div className="text-gray-600 text-xs md:text-sm break-all">{user.email}</div>
                                        {user.role === 'admin' && (
                                            <div className="text-red-600 text-xs font-medium mt-1">ADMINISTRATOR</div>
                                        )}
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        <Link 
                                            href="/profile/purchases"
                                            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition text-sm md:text-base"
                                            onClick={() => setShowDropdown(false)}
                                        >
                                            Pembelian
                                        </Link>
                                        <Link 
                                            href="/profile/cart"
                                            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition text-sm md:text-base"
                                            onClick={() => setShowDropdown(false)}
                                        >
                                            Keranjang
                                        </Link>
                                        <Link 
                                            href="/profile/wishlist"
                                            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition text-sm md:text-base"
                                            onClick={() => setShowDropdown(false)}
                                        >
                                            Wishlist
                                        </Link>
                                        <Link 
                                            href="/profile/settings"
                                            className="block px-4 py-3 text-gray-700 hover:bg-gray-100 transition text-sm md:text-base"
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
                                                    className="block px-4 py-3 text-red-600 hover:bg-red-50 transition font-medium text-sm md:text-base"
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
                                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition flex items-center justify-between text-sm md:text-base"
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
                        <Link href="/login" className="hover:text-gray-300 transition text-sm md:text-lg tracking-wide">
                            LOGIN
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Menu Sidebar - Always rendered for smooth animation */}
            <>
                {/* Overlay */}
                <div 
                    className={`fixed inset-0 bg-black z-40 md:hidden transition-opacity duration-300 ease-in-out pointer-events-none ${
                        showMobileMenu ? 'opacity-50 pointer-events-auto' : 'opacity-0'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                ></div>
                
                {/* Sidebar */}
                <div 
                    ref={mobileMenuRef}
                    className={`fixed top-0 left-0 h-full w-64 bg-black border-r border-gray-700 shadow-2xl z-50 md:hidden transition-transform duration-300 ease-in-out ${
                        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="p-6">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowMobileMenu(false)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Logo */}
                        <div className="mb-8">
                            <Image
                                src={getAsset("assets/Jaws-logo.png")}
                                alt="Jaws Logo"
                                width={80}
                                height={64}
                                className="w-20 h-16"
                            />
                        </div>

                        {/* Navigation Links */}
                        {isCrewHome && crewHomeMenu ? (
                            /* Crew Home Menu */
                            <ul className="space-y-2">
                                <div className="mb-4">
                                    <h3 className="text-gray-400 text-xs font-medium mb-2 uppercase">Manage Catalog</h3>
                                    <li className={`transition-all duration-300 ${
                                        showMobileMenu ? 'opacity-100 translate-x-0 delay-75' : 'opacity-0 -translate-x-4'
                                    }`}>
                                        <button
                                            onClick={() => {
                                                crewHomeMenu.setActiveRoute('new-item');
                                                setShowMobileMenu(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded text-sm ${
                                                crewHomeMenu.activeRoute === 'new-item'
                                                    ? 'bg-gray-700 text-white font-medium'
                                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        >
                                            New item
                                        </button>
                                    </li>
                                    <li className={`transition-all duration-300 ${
                                        showMobileMenu ? 'opacity-100 translate-x-0 delay-100' : 'opacity-0 -translate-x-4'
                                    }`}>
                                        <button
                                            onClick={() => {
                                                crewHomeMenu.setActiveRoute('edit-item');
                                                setShowMobileMenu(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded text-sm ${
                                                crewHomeMenu.activeRoute === 'edit-item'
                                                    ? 'bg-gray-700 text-white font-medium'
                                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        >
                                            Edit item
                                        </button>
                                    </li>
                                    <li className={`transition-all duration-300 ${
                                        showMobileMenu ? 'opacity-100 translate-x-0 delay-150' : 'opacity-0 -translate-x-4'
                                    }`}>
                                        <button
                                            onClick={() => {
                                                crewHomeMenu.setActiveRoute('delete-item');
                                                setShowMobileMenu(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded text-sm ${
                                                crewHomeMenu.activeRoute === 'delete-item'
                                                    ? 'bg-gray-700 text-white font-medium'
                                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        >
                                            Delete item
                                        </button>
                                    </li>
                                </div>
                                
                                <li className={`transition-all duration-300 ${
                                    showMobileMenu ? 'opacity-100 translate-x-0 delay-200' : 'opacity-0 -translate-x-4'
                                }`}>
                                    <button
                                        onClick={() => {
                                            crewHomeMenu.setActiveRoute('manage-order');
                                            setShowMobileMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                                            crewHomeMenu.activeRoute === 'manage-order'
                                                ? 'bg-gray-700 text-white font-medium'
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                        }`}
                                    >
                                        Manage order
                                    </button>
                                </li>
                                
                                <li className={`transition-all duration-300 ${
                                    showMobileMenu ? 'opacity-100 translate-x-0 delay-300' : 'opacity-0 -translate-x-4'
                                }`}>
                                    <button
                                        onClick={() => {
                                            crewHomeMenu.setActiveRoute('manage-user');
                                            setShowMobileMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                                            crewHomeMenu.activeRoute === 'manage-user'
                                                ? 'bg-gray-700 text-white font-medium'
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                        }`}
                                    >
                                        Manage user
                                    </button>
                                </li>
                            </ul>
                        ) : (
                            /* Regular Navigation Menu */
                            <ul className="space-y-4">
                                <li className={`transition-all duration-300 ${
                                    showMobileMenu ? 'opacity-100 translate-x-0 delay-75' : 'opacity-0 -translate-x-4'
                                }`}>
                                    <Link 
                                        href="/" 
                                        className="block text-white hover:text-gray-300 transition text-lg font-medium"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        HOME
                                    </Link>
                                </li>
                                <li className={`transition-all duration-300 ${
                                    showMobileMenu ? 'opacity-100 translate-x-0 delay-100' : 'opacity-0 -translate-x-4'
                                }`}>
                                    <Link 
                                        href="/catalog" 
                                        className="block text-white hover:text-gray-300 transition text-lg font-medium"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        CATALOG
                                    </Link>
                                </li>
                                <li className={`transition-all duration-300 ${
                                    showMobileMenu ? 'opacity-100 translate-x-0 delay-150' : 'opacity-0 -translate-x-4'
                                }`}>
                                    <Link 
                                        href="/contact" 
                                        className="block text-white hover:text-gray-300 transition text-lg font-medium"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        CONTACT
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </>
        </nav>
    );
}