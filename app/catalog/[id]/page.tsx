import ProductDetail from '../../../components/ProductDetail';
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

interface ProductDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    const { id } = await params;
    return (
        <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
            <Navbar />

            <main className='flex-1'>
                <ProductDetail productId={id} />
            </main>

            <Footer />
        </div>
    );
}