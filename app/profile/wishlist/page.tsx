import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function WishlistPage() {
    return (
        <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
            <Navbar />
            
            <main className="flex-1 px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">Wishlist</h1>
                    
                    <div className="bg-gray-800 rounded-lg p-8 text-center">
                        <div className="text-6xl mb-4">❤️</div>
                        <h2 className="text-2xl font-semibold mb-4">Wishlist Kosong</h2>
                        <p className="text-gray-400 mb-6">
                            Belum ada produk yang Anda sukai. Jelajahi katalog dan tambahkan ke wishlist!
                        </p>
                        <a 
                            href="/catalog" 
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition inline-block"
                        >
                            Jelajahi Produk
                        </a>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}