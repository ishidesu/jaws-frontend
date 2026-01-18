'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import OptimizedImage from "../../../components/OptimizedImage";
import { transformImageUrl } from "../../../lib/config";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { cancelExpiredOrders } from "../../../lib/order-utils";

interface CartItem {
    id: string;
    product_id: string;
    quantity: number;
    product: {
        id: string;
        name: string;
        price: number;
        image_url: string;
        stock: number;
    };
}

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [checkingOut, setCheckingOut] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const formatPrice = (price: number): string => {
        return price.toLocaleString('id-ID');
    };

    const getItemSubtotal = (price: number, quantity: number): number => {
        return price * quantity;
    };

    const getCartTotal = (): number => {
        return cartItems.reduce((total, item) => total + getItemSubtotal(item.product.price, item.quantity), 0);
    };

    const truncateText = (text: string, maxLength: number = 15): string => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const fetchCartItems = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select(`
                    id,
                    product_id,
                    quantity,
                    product:products!inner (
                        id,
                        name,
                        price,
                        image_url,
                        stock
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching cart items:', error);
                return;
            }

            const cartData = data || [];
            
            const transformedData: CartItem[] = cartData.map((item: any) => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                product: Array.isArray(item.product) ? item.product[0] : item.product
            }));
            
            const adjustedItems = [];
            const itemsToUpdate = [];

            for (const item of transformedData) {
                if (item.product && item.quantity > item.product.stock) {
                    if (item.product.stock === 0) {
                        itemsToUpdate.push({ id: item.id, action: 'remove' });
                        continue;
                    } else {
                        itemsToUpdate.push({ 
                            id: item.id, 
                            action: 'update', 
                            newQuantity: item.product.stock 
                        });
                        adjustedItems.push({
                            ...item,
                            quantity: item.product.stock
                        });
                    }
                } else {
                    adjustedItems.push(item);
                }
            }

            for (const update of itemsToUpdate) {
                try {
                    if (update.action === 'remove') {
                        await supabase
                            .from('cart_items')
                            .delete()
                            .eq('id', update.id);
                    } else if (update.action === 'update') {
                        await supabase
                            .from('cart_items')
                            .update({ quantity: update.newQuantity })
                            .eq('id', update.id);
                    }
                } catch (updateError) {
                    console.error('Error auto-adjusting cart item:', updateError);
                }
            }

            setCartItems(adjustedItems);
            
            if (itemsToUpdate.length > 0) {
                const removedCount = itemsToUpdate.filter(u => u.action === 'remove').length;
                const adjustedCount = itemsToUpdate.filter(u => u.action === 'update').length;
                
                let message = '';
                if (removedCount > 0 && adjustedCount > 0) {
                    message = `${removedCount} out-of-stock items removed and ${adjustedCount} items adjusted to available stock.`;
                } else if (removedCount > 0) {
                    message = `${removedCount} out-of-stock items removed from cart.`;
                } else if (adjustedCount > 0) {
                    message = `${adjustedCount} items adjusted to available stock.`;
                }
                
                if (message) {
                    setTimeout(() => alert(message), 500);
                }
            }

        } catch (error) {
            console.error('Error fetching cart items:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (cartItemId: string, newQuantity: number, maxStock: number) => {
        if (newQuantity < 1) return;
        
        const currentItem = cartItems.find(item => item.id === cartItemId);
        if (!currentItem) return;
        
        if (newQuantity > currentItem.quantity && newQuantity > maxStock) {
            alert(`Cannot add more. Only ${maxStock} items available in stock.`);
            return;
        }
        
        setUpdating(cartItemId);
        
        try {
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', cartItemId);

            if (error) {
                console.error('Error updating quantity:', error);
                return;
            }

            setCartItems(prev => 
                prev.map(item => 
                    item.id === cartItemId ? { ...item, quantity: newQuantity } : item
                )
            );
        } catch (error) {
            console.error('Error updating quantity:', error);
        } finally {
            setUpdating(null);
        }
    };

    const removeItem = async (cartItemId: string) => {
        setUpdating(cartItemId);
        
        try {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('id', cartItemId);

            if (error) {
                console.error('Error removing item:', error);
                return;
            }

            setCartItems(prev => prev.filter(item => item.id !== cartItemId));
        } catch (error) {
            console.error('Error removing item:', error);
        } finally {
            setUpdating(null);
        }
    };

    const proceedToCheckout = async () => {
        if (cartItems.length === 0) return;
        
        setCheckingOut(true);
        
        try {
            for (const item of cartItems) {
                if (item.quantity > item.product.stock) {
                    throw new Error(`Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}`);
                }
            }

            const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
            
            const { data: order, error: createOrderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user!.id,
                    order_number: orderNumber,
                    total_amount: getCartTotal(),
                    status: 'pending'
                })
                .select()
                .single();

            if (createOrderError) {
                console.error('Error creating order:', createOrderError);
                throw createOrderError;
            }

            const orderItems = cartItems.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_time: item.product.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                console.error('Error creating order items:', itemsError);
                await supabase.from('orders').delete().eq('id', order.id);
                throw itemsError;
            }

            for (const item of cartItems) {
                const { error: stockError } = await supabase
                    .from('products')
                    .update({ stock: item.product.stock - item.quantity })
                    .eq('id', item.product_id);

                if (stockError) {
                    console.error('Error updating stock:', stockError);
                }
            }

            // Clear cart after successful order creation
            const { error: clearCartError } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user!.id);

            if (clearCartError) {
                console.error('Error clearing cart:', clearCartError);
            }

            setCartItems([]);
            
            router.push(`/checkout/receipt/${order.id}`);
            
        } catch (error: any) {
            console.error('Error creating order:', error);
            
            if (error.message.includes('Insufficient stock')) {
                alert(error.message);
                fetchCartItems();
            } else if (error.message.includes('violates row-level security policy')) {
                alert('Authentication error. Please try logging in again.');
                router.push('/login');
            } else {
                alert('Failed to create order. Please try again.');
            }
        } finally {
            setCheckingOut(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            cancelExpiredOrders().then(() => {
                fetchCartItems();
            }).catch(() => {
                fetchCartItems();
            });
        }
    }, [user, authLoading]);

    if (authLoading) {
        return (
            <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading...</p>
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

    if (loading) {
        return (
            <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading cart...</p>
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
                <div className="max-w-7xl mx-auto">
                    {/* Page Title */}
                    <div className="text-center mb-12">
                        <h1 className="text-6xl font-black tracking-wider">CART.</h1>
                    </div>
                    
                    {cartItems.length === 0 ? (
                        <div className="bg-gray-800 rounded-lg p-8 text-center">
                            <div className="text-6xl mb-4">🛒</div>
                            <h2 className="text-2xl font-semibold mb-4">Keranjang Kosong</h2>
                            <p className="text-gray-400 mb-6">
                                Keranjang belanja Anda masih kosong. Tambahkan produk dari katalog!
                            </p>
                            <a 
                                href="/catalog" 
                                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition inline-block"
                            >
                                Mulai Belanja
                            </a>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Cart Items Table */}
                            <div className="lg:col-span-2">
                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="border-b border-gray-600 pb-6">
                                            {/* Desktop Layout */}
                                            <div className="hidden md:flex items-center gap-6">
                                                {/* Product Image */}
                                                <div className="w-32 h-32 bg-white rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    <OptimizedImage
                                                        src={transformImageUrl(item.product.image_url)}
                                                        alt={item.product.name}
                                                        aspectRatio="aspect-square"
                                                        className="max-w-full max-h-full object-contain"
                                                        fallback={
                                                            <div className="flex flex-col items-center justify-center text-gray-400 h-full">
                                                                <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center mb-1">
                                                                    <span className="text-lg">+</span>
                                                                </div>
                                                                <p className="text-xs">No Image</p>
                                                            </div>
                                                        }
                                                    />
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-white font-bold text-xl uppercase tracking-wide mb-2">
                                                        {truncateText(item.product.name, 15)}
                                                    </h3>
                                                    <p className="text-gray-400 text-base mb-1">
                                                        IDR {formatPrice(item.product.price)}
                                                    </p>
                                                    <p className="text-gray-500 text-sm">
                                                        Stock: {item.product.stock}
                                                    </p>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex flex-col items-center gap-2">
                                                    {/* Stock warning if quantity exceeds stock */}
                                                    {item.quantity > item.product.stock && item.product.stock > 0 && (
                                                        <div className="text-orange-400 text-xs font-medium text-center mb-1">
                                                            Exceeds stock! ({item.product.stock} available)
                                                        </div>
                                                    )}
                                                    
                                                    {item.product.stock > 0 ? (
                                                        <div className="flex items-center bg-white rounded-full px-4 py-2">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.product.stock)}
                                                                disabled={updating === item.id || item.quantity <= 1}
                                                                className="text-black font-bold text-lg w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                -
                                                            </button>
                                                            <span className={`font-medium mx-4 min-w-[2rem] text-center ${
                                                                item.quantity > item.product.stock ? 'text-orange-600' : 'text-black'
                                                            }`}>
                                                                {updating === item.id ? '...' : item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.product.stock)}
                                                                disabled={updating === item.id || item.quantity >= item.product.stock}
                                                                className="text-black font-bold text-lg w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-red-400 text-sm font-medium text-center">
                                                            OUT OF STOCK
                                                        </div>
                                                    )}

                                                    {/* Auto-fix button for items exceeding stock */}
                                                    {item.quantity > item.product.stock && item.product.stock > 0 && (
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.product.stock, item.product.stock)}
                                                            disabled={updating === item.id}
                                                            className="text-orange-400 hover:text-orange-300 text-xs underline disabled:opacity-50"
                                                        >
                                                            Fix to {item.product.stock}
                                                        </button>
                                                    )}

                                                    {/* Trash Button */}
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        disabled={updating === item.id}
                                                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-full transition disabled:opacity-50"
                                                        title="Remove item"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Item Total */}
                                                <div className="text-right min-w-[200px]">
                                                    <p className="text-white font-bold text-lg">
                                                        IDR {formatPrice(getItemSubtotal(item.product.price, item.quantity))}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Mobile Layout */}
                                            <div className="flex md:hidden gap-3">
                                                {/* Product Image - Smaller */}
                                                <div className="w-24 h-24 bg-white rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    <OptimizedImage
                                                        src={transformImageUrl(item.product.image_url)}
                                                        alt={item.product.name}
                                                        aspectRatio="aspect-square"
                                                        className="max-w-full max-h-full object-contain"
                                                        fallback={
                                                            <div className="flex flex-col items-center justify-center text-gray-400 h-full">
                                                                <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center mb-1">
                                                                    <span className="text-sm">+</span>
                                                                </div>
                                                                <p className="text-xs">No Image</p>
                                                            </div>
                                                        }
                                                    />
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Name and Quantity Controls in Same Row */}
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <h3 className="text-white font-bold text-sm uppercase tracking-wide flex-1 min-w-0">
                                                            {item.product.name}
                                                        </h3>
                                                        
                                                        {/* Quantity Controls - Compact */}
                                                        {item.product.stock > 0 ? (
                                                            <div className="flex items-center bg-white rounded-full px-2 py-1 flex-shrink-0">
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.product.stock)}
                                                                    disabled={updating === item.id || item.quantity <= 1}
                                                                    className="text-black font-bold text-sm w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className={`font-medium mx-2 min-w-[1.5rem] text-center text-sm ${
                                                                    item.quantity > item.product.stock ? 'text-orange-600' : 'text-black'
                                                                }`}>
                                                                    {updating === item.id ? '...' : item.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.product.stock)}
                                                                    disabled={updating === item.id || item.quantity >= item.product.stock}
                                                                    className="text-black font-bold text-sm w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="text-red-400 text-xs font-medium">
                                                                OUT OF STOCK
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Stock and Price in Second Row */}
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <p className="text-gray-500 text-xs">
                                                            Stock: {item.product.stock}
                                                        </p>
                                                        <p className="text-gray-400 text-sm font-medium">
                                                            IDR {formatPrice(item.product.price)}
                                                        </p>
                                                    </div>

                                                    {/* Stock Warning */}
                                                    {item.quantity > item.product.stock && item.product.stock > 0 && (
                                                        <div className="text-orange-400 text-xs mb-1">
                                                            Exceeds stock! ({item.product.stock} available)
                                                        </div>
                                                    )}

                                                    {/* Actions Row */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        {/* Auto-fix button */}
                                                        {item.quantity > item.product.stock && item.product.stock > 0 && (
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.product.stock, item.product.stock)}
                                                                disabled={updating === item.id}
                                                                className="text-orange-400 hover:text-orange-300 text-xs underline disabled:opacity-50"
                                                            >
                                                                Fix to {item.product.stock}
                                                            </button>
                                                        )}
                                                        
                                                        <div className="flex items-center gap-2 ml-auto">
                                                            {/* Trash Button */}
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                disabled={updating === item.id}
                                                                className="text-red-400 hover:text-red-300 p-1 hover:bg-red-900/20 rounded-full transition disabled:opacity-50"
                                                                title="Remove item"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cart Totals */}
                            <div className="lg:col-span-1">
                                <div className="border border-gray-600 rounded-lg p-6 sticky top-8">
                                    <h2 className="text-white font-bold text-xl mb-6 border-b border-gray-600 pb-4">
                                        Cart totals
                                    </h2>
                                    
                                    <div className="space-y-4 mb-6">
                                        {/* Individual Item Breakdown */}
                                        {cartItems.map((item) => (
                                            <div key={`total-${item.id}`} className="flex justify-between text-sm">
                                                <span className="text-gray-400">
                                                    {truncateText(item.product.name, 15)} × {item.quantity}
                                                </span>
                                                <span className="text-white">
                                                    IDR {formatPrice(getItemSubtotal(item.product.price, item.quantity))}
                                                </span>
                                            </div>
                                        ))}
                                        
                                        <div className="border-t border-gray-600 pt-4">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400 uppercase tracking-wide">SUBTOTAL</span>
                                                <span className="text-white font-medium">
                                                    IDR {formatPrice(getCartTotal())}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="border-t border-gray-600 pt-4">
                                            <div className="flex justify-between">
                                                <span className="text-white font-bold uppercase tracking-wide">TOTAL</span>
                                                <span className="text-white font-bold text-lg">
                                                    IDR {formatPrice(getCartTotal())}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={proceedToCheckout}
                                        disabled={checkingOut || cartItems.length === 0}
                                        className="w-full bg-white text-black font-medium py-3 px-6 rounded-full hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {checkingOut ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                                Processing...
                                            </div>
                                        ) : (
                                            'Proceed to checkout'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}