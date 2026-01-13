'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import OptimizedImage from "../../../components/OptimizedImage";
import { transformImageUrl } from "../../../lib/config";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";

interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    price_at_time: number;
    product: {
        id: string;
        name: string;
        image_url: string;
    };
}

interface Order {
    id: string;
    order_number: string;
    status: 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'completed';
    total_amount: number;
    created_at: string;
    expires_at: string;
    order_items: OrderItem[];
}

export default function PurchasesPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const formatPrice = (price: number): string => {
        return price.toLocaleString('id-ID');
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending':
                return { color: 'bg-yellow-600 text-yellow-100', label: 'PENDING' };
            case 'confirmed':
                return { color: 'bg-blue-600 text-blue-100', label: 'CONFIRMED' };
            case 'paid':
                return { color: 'bg-purple-600 text-purple-100', label: 'PAID' };
            case 'completed':
                return { color: 'bg-green-600 text-green-100', label: 'COMPLETED' };
            case 'cancelled':
                return { color: 'bg-red-600 text-red-100', label: 'CANCELLED' };
            default:
                return { color: 'bg-gray-600 text-gray-100', label: status.toUpperCase() };
        }
    };

    const fetchOrders = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

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
                            id,
                            name,
                            image_url
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching orders:', error);
                return;
            }

            const transformedOrders: Order[] = (data || []).map((order: any) => ({
                ...order,
                order_items: order.order_items.map((item: any) => ({
                    ...item,
                    product: Array.isArray(item.product) ? item.product[0] : item.product
                }))
            }));

            setOrders(transformedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => 
        selectedStatus === 'all' || order.status === selectedStatus
    );

    const viewOrderDetails = (orderId: string) => {
        router.push(`/checkout/receipt/${orderId}`);
    };

    useEffect(() => {
        if (!authLoading) {
            fetchOrders();
        }
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading purchases...</p>
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

    return (
        <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
            <Navbar />
            
            <main className="flex-1 px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Page Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-bold">Pembelian</h1>
                        
                        {/* Status Filter */}
                        {orders.length > 0 && (
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="paid">Paid</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        )}
                    </div>
                    
                    {filteredOrders.length === 0 ? (
                        <div className="bg-gray-800 rounded-lg p-8 text-center">
                            <div className="text-6xl mb-4">📦</div>
                            <h2 className="text-2xl font-semibold mb-4">
                                {selectedStatus === 'all' ? 'Belum Ada Pembelian' : `Tidak Ada Pesanan ${selectedStatus.toUpperCase()}`}
                            </h2>
                            <p className="text-gray-400 mb-6">
                                {selectedStatus === 'all' 
                                    ? 'Anda belum melakukan pembelian apapun. Mulai berbelanja sekarang!'
                                    : `Tidak ada pesanan dengan status ${selectedStatus}.`
                                }
                            </p>
                            {selectedStatus === 'all' ? (
                                <a 
                                    href="/catalog" 
                                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition inline-block"
                                >
                                    Lihat Katalog
                                </a>
                            ) : (
                                <button
                                    onClick={() => setSelectedStatus('all')}
                                    className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition"
                                >
                                    Lihat Semua Pesanan
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredOrders.map((order) => (
                                <div key={order.id} className="bg-gray-800 rounded-lg p-6">
                                    {/* Order Header */}
                                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-600">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">
                                                {order.order_number}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {formatDate(order.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(order.status).color}`}>
                                                {getStatusInfo(order.status).label}
                                            </span>
                                            <button
                                                onClick={() => viewOrderDetails(order.id)}
                                                className="text-blue-400 hover:text-blue-300 text-sm underline"
                                            >
                                                Lihat Detail
                                            </button>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-3 mb-4">
                                        {order.order_items.slice(0, 3).map((item) => (
                                            <div key={item.id} className="flex items-center gap-4">
                                                {/* Product Image */}
                                                <div className="w-16 h-16 bg-white rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    <OptimizedImage
                                                        src={transformImageUrl(item.product.image_url)}
                                                        alt={item.product.name}
                                                        aspectRatio="aspect-square"
                                                        className="max-w-full max-h-full object-contain"
                                                        fallback={
                                                            <div className="flex flex-col items-center justify-center text-gray-400 h-full">
                                                                <div className="w-4 h-4 border border-gray-300 rounded-full flex items-center justify-center">
                                                                    <span className="text-xs">+</span>
                                                                </div>
                                                            </div>
                                                        }
                                                    />
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">
                                                        {item.product.name}
                                                    </p>
                                                    <p className="text-gray-400 text-sm">
                                                        {item.quantity} × IDR {formatPrice(item.price_at_time)}
                                                    </p>
                                                </div>

                                                {/* Item Total */}
                                                <div className="text-right">
                                                    <p className="text-white font-medium">
                                                        IDR {formatPrice(item.price_at_time * item.quantity)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Show more items indicator */}
                                        {order.order_items.length > 3 && (
                                            <div className="text-center py-2">
                                                <p className="text-gray-400 text-sm">
                                                    +{order.order_items.length - 3} item lainnya
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Total */}
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-600">
                                        <span className="text-gray-400">Total Pesanan</span>
                                        <span className="text-white font-bold text-lg">
                                            IDR {formatPrice(order.total_amount)}
                                        </span>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => viewOrderDetails(order.id)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                                        >
                                            Lihat Detail
                                        </button>
                                        
                                        {order.status === 'pending' && (
                                            <a
                                                href={`https://wa.me/6287872152600?text=${encodeURIComponent(`Halo, saya ingin menanyakan status pesanan ${order.order_number}`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                                </svg>
                                                WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}