'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";
import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../contexts/AuthContext";
import { cancelOrderSafely } from "../../../../lib/order-utils";

interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    price_at_time: number;
    product: {
        name: string;
    };
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
    expires_at: string;
    order_items: OrderItem[];
}

function ReceiptPageContent() {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const orderId = params.orderId as string;

    const formatPrice = (price: number): string => {
        return price.toLocaleString('id-ID');
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateTimeLeft = (expiryDate: string): string => {
        const now = new Date().getTime();
        const expiry = new Date(expiryDate).getTime();
        const difference = expiry - now;

        if (difference <= 0) {
            return 'Expired';
        }

        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    useEffect(() => {
        if (!order || order.status !== 'pending') return;

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft(order.expires_at);
            setTimeLeft(remaining);
            
            if (remaining === 'Expired') {
                clearInterval(timer);
                fetchOrder();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [order]);

    const fetchOrder = async () => {
        if (!user || !orderId) return;

        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    order_number,
                    status,
                    total_amount,
                    created_at,
                    expires_at,
                    order_items (
                        id,
                        product_id,
                        quantity,
                        price_at_time,
                        product:products!inner (
                            name
                        )
                    )
                `)
                .eq('id', orderId)
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('Error fetching order:', error);
                router.push('/profile/cart');
                return;
            }

            if (data) {
                const transformedOrder: Order = {
                    ...data,
                    order_items: data.order_items.map((item: any) => ({
                        ...item,
                        product: Array.isArray(item.product) ? item.product[0] : item.product
                    }))
                };
                setOrder(transformedOrder);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
            router.push('/profile/cart');
        } finally {
            setLoading(false);
        }
    };

    const cancelOrder = async () => {
        if (!order) return;

        setCancelling(true);
        try {
            const result = await cancelOrderSafely(order.id);
            
            if (!result.success) {
                console.error('Error cancelling order:', result.error);
                alert(`Failed to cancel order: ${result.error}`);
                return;
            }

            console.log('Order cancelled successfully');
            router.push('/profile/purchases');
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order');
        } finally {
            setCancelling(false);
        }
    };

    const generateWhatsAppMessage = () => {
        if (!order) return '';

        const items = order.order_items.map(item => 
            `• ${item.product.name} x${item.quantity} - IDR ${formatPrice(item.price_at_time * item.quantity)}`
        ).join('\n');

        return encodeURIComponent(
            `Halo, saya ingin konfirmasi pesanan:\n\n` +
            `Order ID: ${order.order_number}\n` +
            `Tanggal: ${formatDate(order.created_at)}\n\n` +
            `Detail Pesanan:\n${items}\n\n` +
            `Total: IDR ${formatPrice(order.total_amount)}\n\n` +
            `Mohon diproses lebih lanjut. Terima kasih!`
        );
    };

    useEffect(() => {
        if (!authLoading) {
            fetchOrder();
        }
    }, [user, authLoading, orderId]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading receipt...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    if (!order) {
        return (
            <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-2xl text-gray-400 mb-4">Order not found</p>
                        <button
                            onClick={() => router.push('/profile/purchases')}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
                        >
                            Back to Purchases
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
            <Navbar />
            
            <main className="flex-1 px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    {/* Page Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black tracking-wider mb-2">ORDER RECEIPT</h1>
                        <p className="text-gray-400">Order placed successfully</p>
                    </div>
                    
                    {/* Receipt Box */}
                    <div className="bg-gray-800 rounded-lg p-8 mb-8">
                        {/* Order Header */}
                        <div className="border-b border-gray-600 pb-4 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">
                                        {order.order_number}
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        {formatDate(order.created_at)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        order.status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                                        order.status === 'confirmed' ? 'bg-blue-600 text-blue-100' :
                                        order.status === 'paid' ? 'bg-purple-600 text-purple-100' :
                                        order.status === 'cancelled' ? 'bg-red-600 text-red-100' :
                                        order.status === 'completed' ? 'bg-green-600 text-green-100' :
                                        'bg-gray-600 text-gray-100'
                                    }`}>
                                        {order.status.toUpperCase()}
                                    </span>
                                    
                                    {/* Countdown Timer for Pending Orders */}
                                    {order.status === 'pending' && (
                                        <div className="mt-2">
                                            <p className="text-orange-400 text-xs font-medium">
                                                {timeLeft === 'Expired' ? (
                                                    'Order Expired'
                                                ) : (
                                                    `Confirm before ${timeLeft}`
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3 mb-6">
                            {order.order_items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{item.product.name}</p>
                                        <p className="text-gray-400 text-sm">
                                            IDR {formatPrice(item.price_at_time)} × {item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-medium">
                                            IDR {formatPrice(item.price_at_time * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="border-t border-gray-600 pt-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-white font-bold text-lg">TOTAL</span>
                                <span className="text-white font-bold text-xl">
                                    IDR {formatPrice(order.total_amount)}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {order.status === 'pending' && (
                            <div className="space-y-3">
                                {/* WhatsApp Button */}
                                <a
                                    href={`https://wa.me/6281282583892?text=${generateWhatsAppMessage()}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-full transition flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                    </svg>
                                    Chat WhatsApp
                                </a>

                                {/* Cancel Button */}
                                <button
                                    onClick={cancelOrder}
                                    disabled={cancelling}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cancelling ? 'Cancelling...' : 'Batalkan Pesanan'}
                                </button>
                            </div>
                        )}

                        {order.status === 'cancelled' && (
                            <div className="text-center">
                                <p className="text-red-400 mb-4">This order has been cancelled</p>
                                <button
                                    onClick={() => router.push('/profile/purchases')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full transition"
                                >
                                    Back to purchases
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Terms and Conditions */}
                    <div className="bg-gray-900 rounded-lg p-6">
                        <h3 className="text-white font-bold text-lg mb-4">Ketentuan Pemesanan:</h3>
                        <div className="text-gray-300 space-y-3 text-sm leading-relaxed">
                            <p>
                                <strong>1.</strong> Lakukan konfirmasi kepada admin dengan menekan tombol WhatsApp diatas untuk di proses lebih lanjut. 
                                Jika tidak melakukan konfirmasi, pemesanan akan dibatalkan dalam waktu 24 jam.
                            </p>
                            <p>
                                <strong>2.</strong> Pembayaran dapat dilakukan dengan melalui WhatsApp atau membayar langsung di toko.
                            </p>
                            <p>
                                <strong>3.</strong> Barang dapat diambil secara langsung ke toko dengan batas maksimal 5 hari (untuk pembayaran langsung di toko). 
                                Jika tidak diambil dalam waktu yang ditentukan, maka pemesanan akan dibatalkan otomatis oleh sistem.
                            </p>
                            <p>
                                <strong>4.</strong> Untuk yang sudah membayar lewat WhatsApp, pengambilan barang tidak ditentukan oleh waktu sistem.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function ReceiptPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading receipt...</p>
                    </div>
                </main>
                <Footer />
            </div>
        }>
            <ReceiptPageContent />
        </Suspense>
    );
}