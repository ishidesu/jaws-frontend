import Link from "next/link"
import Image from "next/image"
import img1 from "../assets/home/bengkel.webp"
import img2 from "../assets/home/gugu.webp"
import chopper from "../assets/home/chopper.webp"
import tracker from "../assets/home/tracker.webp"
import chicano from "../assets/home/CICANO.webp"
import fatboy from "../assets/home/BIG BACK.webp"
import caferacer from "../assets/home/CAPERESER.webp"

export default function Menu() {
    return (
        <div className="relative flex-row w-full justify-center overflow-hidden">
            <div className="relative w-full h-[550px] md:h-[620px] flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <Image
                    src={img1}
                    alt=""
                    fill
                    priority
                    className="object-cover object-center brightness-50"
                />

                {/* Overlay Content */}
                <div className="relative z-10 w-full px-5 md:px-10">

                    {/* LEFT TEXT */}
                    <div className="flex flex-col items-start text-white max-w-xl -mt-20">
                        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
                            NEW!
                        </h1>

                        <p className="text-base md:text-lg leading-relaxed">
                            Rangka chopper terbaru dari bengkel kami hadir dengan gaya klasik yang gagah dan
                            sentuhan modern yang berani. Dibuat secara handmade dengan presisi tinggi, memastikan
                            kekuatan dan karakter sejati khas motor custom.
                        </p>
                    </div>

                    {/* BUTTON (center bottom) */}
                    <div className="absolute w-full flex justify-center mt-30 -ml-10">
                        <button className="px-20 py-3 rounded-full bg-white text-black text-lg font-medium hover:bg-gray-200 transition">
                            Order now
                        </button>
                    </div>

                </div>
            </div>

            {/* CATEGORIES SECTION */}
            <div className="flex w-full justify-center">
                <h1 className="text-5xl font-extrabold my-10">
                    CATEGORIES
                </h1>
            </div>
            {/* Images Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-36 w-full max-w-[1600] mx-auto px-5">

                {/* LEFT IMAGE – CHOPPER */}
                <div className="relative w-full h-[450px] md:h-[600px] overflow-hidden group rounded">
                    <Image
                        src={chopper}
                        alt="Chopper"
                        fill
                        className="object-cover object-center group-hover:scale-105 transition duration-300"
                    />

                    {/* Text Overlay */}
                    <div className="absolute bottom-5 w-full text-center">
                        <h2 className="text-white text-2xl md:text-3xl font-extrabold drop-shadow-lg">
                        CHOPPER
                        </h2>
                    </div>
                </div>

                {/* RIGHT IMAGE – TRACKER */}
                <div className="relative w-full h-[450px] md:h-[600px] overflow-hidden group rounded">
                <Image
                    src={tracker}
                    alt="Tracker"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition duration-300"
                />

                    {/* Text Overlay */}
                    <div className="absolute bottom-5 w-full text-center">
                        <h2 className="text-white text-2xl md:text-3xl font-extrabold drop-shadow-lg">
                        TRACKER
                        </h2>
                    </div>
                </div>
            </div>

            {/* BUILD YOUR OWN SECTION */}
            <div className="flex w-full justify-center">
                <h1 className="text-8xl font-extrabold my-10">
                    BUILD YOUR OWN STORIES.
                </h1>
            </div>

            {/* Images Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 w-full max-w-[1600] mx-auto px-5 pb-20">

                {/* LEFT IMAGE – CHICANO */}
                <div className="relative w-full h-[450px] md:h-[600px] overflow-hidden group rounded">
                    <Image
                        src={chicano}
                        alt="Chicano"
                        fill
                        className="object-cover object-center group-hover:scale-105 transition duration-300"
                    />

                    {/* Text Overlay */}
                    <div className="absolute bottom-5 w-full text-center">
                        <h2 className="text-white text-2xl md:text-3xl font-extrabold drop-shadow-lg">
                        CHICANO
                        </h2>
                    </div>
                </div>

                {/* MIDDLE IMAGE – FAT BOY */}
                <div className="relative w-full h-[450px] md:h-[600px] overflow-hidden group rounded">
                <Image
                    src={fatboy}
                    alt="Fat Boy"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition duration-300"
                />

                    {/* Text Overlay */}
                    <div className="absolute bottom-5 w-full text-center">
                        <h2 className="text-white text-2xl md:text-3xl font-extrabold drop-shadow-lg">
                        FAT BOY
                        </h2>
                    </div>
                </div>

                {/* RIGHT IMAGE – CAFERACER */}
                <div className="relative w-full h-[450px] md:h-[600px] overflow-hidden group rounded">
                <Image
                    src={caferacer}
                    alt="Caferacer"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition duration-300"
                />

                    {/* Text Overlay */}
                    <div className="absolute bottom-5 w-full text-center">
                        <h2 className="text-white text-2xl md:text-3xl font-extrabold drop-shadow-lg">
                        CAFERACER
                        </h2>
                    </div>
                </div>
            </div>

            {/* Bottom Hero Section */}
            <div className="relative w-full h-[550px] md:h-[620px] flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <Image
                    src={img2}
                    alt=""
                    fill
                    priority
                    className="object-cover object-center brightness-50"
                />

                {/* Overlay Content */}
                <div className="absolute right-40 md:right-[400] z-10 text-white max-w-2xl flex flex-col gap-6">

                    {/* TITLE */}
                    <h2 className="text-3xl md:text-5xl font-extrabold leading-tight text-center w-full md:w-[800]">
                        Stay Up to Date with All News <br /> 
                        and Exclusive Offers
                    </h2>

                    {/* EMAIL FORM */}
                    <div className="flex items-cente rounded-full pl-6 pr-2 py-3 w-full md:w-[430px] gap-10 ml-44">
                        <input
                            type="email"
                            placeholder="Your email"
                            className="flex-1 text-black text-lg outline-none bg-white rounded-full text-center"
                        />

                        <button className="w-12 h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition">
                            <span className="text-white text-2xl">›</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}