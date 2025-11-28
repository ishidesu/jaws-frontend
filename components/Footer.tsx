import Image from "next/image"
import Link from "next/link"
import logo from "../assets/Jaws-logo.png"

export default function Footer() {
    return(
        <footer className="w-full bg-black text-white py-20 px-10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10">

                {/* LOGO */}
                <div className="flex justify-center md:justify-start -ml-20 -mt-10">
                    <Image 
                        src={logo} 
                        alt="Logo" 
                        className="w-[350px] h-auto"
                    />
                </div>

                {/* TEXT COLUMNS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">

                    <div>
                        <h3 className="font-bold text-lg mb-4">USEFUL LINKS</h3>
                        <ul className="space-y-3 text-gray-300">
                            <li>Be Our Partner</li>
                            <li>Our Workshop</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-4">INFORMATION</h3>
                        <ul className="space-y-3 text-gray-300">
                            <li>Payment Confirmation</li>
                            <li>Track Your Order</li>
                            <li>Return Policy</li>
                            <li>Contact Us</li>
                            <li>FAQ</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-4">CUSTOMER SERVICE</h3>
                        <p className="text-gray-300">
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