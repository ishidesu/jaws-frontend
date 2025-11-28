import Image from "next/image";
import Link from "next/link";
import bg from "../assets/user register & crew login/login-bgimage.jpg";
import logo from "../assets/Jaws-logo.png";

export default function Login() {
    return (
        <div className="relative w-full min-h-screen">

            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="relative w-full h-full">
                    <Image
                        src={bg}
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
                        src={logo}
                        alt="Jaws Logo"
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

                    {/* Input Form */}
                    <div className="w-full flex flex-col space-y-4">
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-4 py-3 rounded-md bg-white/90 text-black placeholder-gray-600 focus:outline-none"
                        />
                    </div>

                    {/* Button */}
                    <button className="mt-6 w-auto pl-5 pr-5 py-3 bg-gray-300 hover:bg-gray-400 text-black rounded-full transition font-medium">
                        Login
                    </button>

                    {/* Register Link */}
                    <Link href="/register" className="mt-4 text-sm text-white/80 hover:text-white cursor-pointer">
                        Create a New account.
                    </Link>

                    {/* Crew Link */}
                    <Link href="/crewlogin" className="mt-4 text-sm text-white/80 hover:text-white cursor-pointer">
                        Login with Crew account.
                    </Link>
                </div>
            </div>

        </div>
    );
}
