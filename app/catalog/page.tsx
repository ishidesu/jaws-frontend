import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Catalog from "../../components/Catalog";

export default function CatalogPage() {
    return (
        <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
            <Navbar />
            
            <main className="flex-1">
                <Catalog />
            </main>

            <Footer />
        </div>
    );
}