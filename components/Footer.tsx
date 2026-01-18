import Image from "next/image"
import Link from "next/link"
import { getAsset } from "../utils/assets";

export default function Footer() {
    return(
        <footer className="w-full bg-black text-white py-10 md:py-20 px-6 md:px-10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 md:gap-10">

                {/* LOGO */}
                <div className="flex justify-center md:justify-start md:-ml-20 md:-mt-10">
                    <div className="relative w-48 h-36 md:w-[350px] md:h-auto">
                        <Image 
                            src={getAsset("assets/Jaws-logo.png")}
                            alt="Logo" 
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* TEXT COLUMNS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 w-full">

                    <div>
                        <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">USEFUL LINKS</h3>
                        <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-300">
                            <li>Be Our Partner</li>
                            <li>Our Workshop</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">INFORMATION</h3>
                        <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-300">
                            <li>Payment Confirmation</li>
                            <li>Track Your Order</li>
                            <li>Return Policy</li>
                            <li>Contact Us</li>
                            <li>FAQ</li>
                        </ul>
                    </div>

                    <div className="sm:col-span-2 md:col-span-1">
                        <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">CUSTOMER SERVICE</h3>
                        <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                            <span className="font-semibold">Online Purchase & Services</span><br/>
                            Monday – Saturday<br/>
                            (10.00 – 17.00 WIB)<br/><br/>
                            Whatsapp : <span className="font-bold">087872152600</span>
                        </p>
                    </div>

                </div>
            </div>
        </footer>
    );
}