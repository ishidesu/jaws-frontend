import Link from "next/link"
import Image from "next/image"
import { getAsset } from "../utils/assets";

export default function Menu() {
    return (
        <div className="relative flex-row w-full justify-center overflow-hidden">
            <div className="relative w-full h-[550px] md:h-[620px] flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <Image
                    src={getAsset("assets/home/bengkel.webp")}
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
                    <div className="absolute w-full flex justify-center mt-30 -ml-5">
                        <Link href="/catalog">
                            <button className="px-20 py-3 rounded-full bg-white text-black text-lg font-medium hover:bg-gray-200 transition">
                                Order now
                            </button>
                        </Link>
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
                        src={getAsset("assets/home/chopper.webp")}
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
                    src={getAsset("assets/home/tracker.webp")}
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
                        src={getAsset("assets/home/CICANO.webp")}
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
                    src={getAsset("assets/home/BIGBACK.webp")}
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
                    src={getAsset("assets/home/CAPERESER.webp")}
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
                    src={getAsset("assets/home/gugu.webp")}
                    alt=""
                    fill
                    priority
                    className="object-cover object-center brightness-50"
                />

                {/* Overlay Content */}
                <div className="absolute inset-0 z-10 flex items-center justify-center px-6 md:px-0 md:right-40 md:left-auto">
                    <div className="text-white max-w-2xl flex flex-col gap-6 w-full md:w-auto">
                        {/* TITLE */}
                        <h2 className="text-2xl md:text-5xl font-extrabold leading-tight text-center md:w-[800px]">
                            Stay Up to Date with All News <br className="hidden md:block" /> 
                            <span className="md:inline"> and Exclusive Offers</span>
                        </h2>

                        {/* EMAIL FORM */}
                        <div className="flex items-center bg-white rounded-full pl-4 md:pl-6 pr-2 py-2 md:py-3 w-full md:w-[430px] gap-4 md:gap-10 mx-auto md:ml-44">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="flex-1 text-black text-base md:text-lg outline-none bg-transparent text-center"
                            />

                            <button className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition flex-shrink-0">
                                <span className="text-white text-xl md:text-2xl">›</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}