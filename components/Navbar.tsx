import Image from "next/image";
import Link from "next/link";
import logo from "../assets/Jaws-logo.png"

export default function Navbar() {
    return (
        <nav className="w-full bg-black text-white py-4 px-6 flex items-center justify-between shadow-lg">
            {/* Logo */}
            <div className="flex items-center space-x-3 tracking-wide">
                <Image
                    className="relative w-20 h-16"
                    src={logo}
                    alt="Jaws Logo"
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

            {/* Login */}
            <div>
                <Link href="/login" className="hover:text-gray-300 transition pr-20 text-lg tracking-wide">LOGIN</Link>
            </div>
        </nav>
    );
}