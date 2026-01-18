"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { supabase } from "@/lib/supabase";
import { transformImageUrl } from "@/lib/config";
import OptimizedImage from "@/components/OptimizedImage";

interface WishlistItem {
    id: string;
    product_id: string;
    created_at: string;
    products: {
        id: string;
        name: string;
        price: number;
        image_url: string | null;
        stock: number;
    };
}

export default function WishlistPage() {
    const router = useRouter();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            setIsLoading(true);
            
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('wishlist')
                .select(`
                    id,
                    product_id,
                    created_at,
                    products (
                        id,
                        name,
                        price,
                        image_url,
                        stock
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to match WishlistItem type
            const transformedData = (data || []).map((item: any) => ({
                id: item.id,
                product_id: item.product_id,
                created_at: item.created_at,
                products: Array.isArray(item.products) ? item.products[0] : item.products
            }));

            setWishlistItems(transformedData);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            alert('Failed to load wishlist');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (wishlistId: string, productName: string) => {

        setRemovingItems(prev => new Set(prev).add(wishlistId));
        
        try {
            const { error } = await supabase
                .from('wishlist')
                .delete()
                .eq('id', wishlistId);

            if (error) throw error;

            setWishlistItems(prev => prev.filter(item => item.id !== wishlistId));
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            alert('Failed to remove from wishlist');
        } finally {
            setRemovingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(wishlistId);
                return newSet;
            });
        }
    };

    const handleAddToCart = async (productId: string, productName: string, stock: number) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                router.push('/login');
                return;
            }

            // Check if already in cart
            const { data: existingItem, error: checkError } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingItem) {
                const newQuantity = existingItem.quantity + 1;
                
                if (newQuantity > stock) {
                    alert(`Cannot add more items. Only ${stock - existingItem.quantity} more available.`);
                    return;
                }

                const { error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;
                
                alert(`Updated cart! Now you have ${newQuantity} ${productName} in your cart.`);
            } else {
                const { error: insertError } = await supabase
                    .from('cart_items')
                    .insert({
                        user_id: user.id,
                        product_id: productId,
                        quantity: 1
                    });

                if (insertError) throw insertError;
                
                alert(`Added ${productName} to cart!`);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add to cart');
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <p className="text-2xl text-gray-400">Loading wishlist...</p>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
            <Navbar />
            
            <main className="flex-1 px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">My Wishlist</h1>
                    
                    {wishlistItems.length === 0 ? (
                        <div className="bg-gray-800 rounded-lg p-8 text-center">
                            <div className="text-6xl mb-4">❤️</div>
                            <h2 className="text-2xl font-semibold mb-4">Wishlist Kosong</h2>
                            <p className="text-gray-400 mb-6">
                                Belum ada produk yang Anda sukai. Jelajahi katalog dan tambahkan ke wishlist!
                            </p>
                            <button
                                onClick={() => router.push('/catalog')}
                                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition inline-block"
                            >
                                Jelajahi Produk
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                            {wishlistItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-shadow"
                                >
                                    {/* Product Image */}
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => router.push(`/catalog/${item.products.id}`)}
                                    >
                                        <OptimizedImage
                                            src={transformImageUrl(item.products.image_url)}
                                            alt={item.products.name}
                                            aspectRatio="aspect-square"
                                            objectFit="contain"
                                            className="bg-white"
                                            fallback={
                                                <div className="flex items-center justify-center h-full text-gray-400">
                                                    <svg className="w-8 h-8 sm:w-12 md:w-16" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            }
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-2 sm:p-3 md:p-4 space-y-2 md:space-y-3">
                                        <h3
                                            className="font-semibold text-xs sm:text-sm md:text-lg line-clamp-2 cursor-pointer hover:text-blue-400 transition"
                                            onClick={() => router.push(`/catalog/${item.products.id}`)}
                                        >
                                            {item.products.name}
                                        </h3>
                                        
                                        <p className="text-sm sm:text-base md:text-xl font-bold text-blue-400">
                                            {formatPrice(item.products.price)}
                                        </p>

                                        <p className="text-xs sm:text-sm text-gray-400">
                                            Stock: {item.products.stock}
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-2">
                                            <button
                                                onClick={() => handleAddToCart(item.products.id, item.products.name, item.products.stock)}
                                                disabled={item.products.stock === 0}
                                                className="w-full py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {item.products.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                            </button>
                                            
                                            <button
                                                onClick={() => handleRemoveFromWishlist(item.id, item.products.name)}
                                                disabled={removingItems.has(item.id)}
                                                className="w-full py-1.5 sm:py-2 text-xs sm:text-sm bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                                            >
                                                {removingItems.has(item.id) ? 'Removing...' : 'Remove'}
                                            </button>
                                        </div>
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