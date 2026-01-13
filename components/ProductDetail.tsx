"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';
import { transformImageUrl } from '@/lib/config';
import OptimizedImage from './OptimizedImage';

interface Product {
    id: string;
    name: string;
    price: number;
    description: string | null;
    image_url: string | null;
    stock: number;
    vehicle_type: string | null;
    item_type: string | null;
    created_at: string;
}

interface ProductDetailProps {
    productId: string;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
    const isMountedRef = useRef(true);
    const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchProduct = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (!isMountedRef.current) return;

            if (error) {
                console.error('Error fetching product:', error);
                setError('Product not found');
                return;
            }

            if (!data) {
                setError('Product not found');
                return;
            }

            setProduct(data);
        } catch (error) {
            if (!isMountedRef.current) return;
            console.error('Error fetching product:', error);
            setError('Failed to load product');
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        fetchProduct();

        return () => {
            isMountedRef.current = false;
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [productId]);

    useEffect(() => {
        if (isLoading && !product && !error && isMountedRef.current) {
            // Start auto-refresh after 8 seconds of loading
            refreshTimeoutRef.current = setTimeout(() => {
                if (isLoading && !product && !error && isMountedRef.current) {
                    console.log('Auto-refreshing page due to long loading time...');
                    window.location.reload();
                }
            }, 5000);
        } else {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
        }

        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
        };
    }, [isLoading, product, error]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity < 1) return;
        if (product && newQuantity > product.stock) return;
        setQuantity(newQuantity);
    };

    const handleAddToCart = async () => {
        if (!product) return;
        
        setIsAddingToCart(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                alert('Please login to add items to cart');
                router.push(`/catalog/${product.id}`);
                return;
            }

            const { data: existingItem, error: checkError } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', product.id)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                
                if (newQuantity > product.stock) {
                    alert(`Cannot add more items. Only ${product.stock - existingItem.quantity} more available.`);
                    return;
                }

                const { error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;
                
                alert(`Updated cart! Now you have ${newQuantity} ${product.name} in your cart.`);
            } else {
                const { error: insertError } = await supabase
                    .from('cart_items')
                    .insert({
                        user_id: user.id,
                        product_id: product.id,
                        quantity: quantity
                    });

                if (insertError) throw insertError;
                
                alert(`Added ${quantity} ${product.name} to cart!`);
            }
            
            setQuantity(1);
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add to cart. Please try again.');
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleAddToWishlist = async () => {
        if (!product) return;
        
        setIsAddingToWishlist(true);
        try {
            console.log(`Adding ${product.name} to wishlist`);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            alert(`Added ${product.name} to wishlist!`);
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            alert('Failed to add to wishlist');
        } finally {
            setIsAddingToWishlist(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-2xl text-gray-400 opacity-50 font-light tracking-widest">
                    LOADING...
                </p>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <p className="text-3xl text-gray-400 opacity-50 font-light tracking-widest mb-8">
                    {error || 'PRODUCT NOT FOUND'}
                </p>
                <button
                    onClick={() => router.push('/catalog')}
                    className="px-8 py-4 bg-white text-black rounded-full hover:bg-gray-200 transition-colors font-medium"
                >
                    Back to Catalog
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white" style={{backgroundColor: '#111111'}}>
            <div className="px-6 py-8 max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/catalog')}
                    className="mb-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Catalog
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Left Column - Product Image */}
                    <OptimizedImage
                        src={transformImageUrl(product.image_url)}
                        alt={product.name}
                        aspectRatio="aspect-square"
                        objectFit="contain"
                        className="bg-white rounded-lg"
                        fallback={
                            <div className="text-gray-400 text-center">
                                <svg className="w-24 h-24 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <p className="text-lg">No Image Available</p>
                            </div>
                        }
                    />

                    {/* Right Column - Product Details */}
                    <div className="space-y-8">
                        {/* Product Name - Max 3 lines with truncation */}
                        <div className="max-w-full">
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-wide uppercase line-clamp-3 leading-tight break-words">
                                {product.name}
                            </h1>
                        </div>

                        {/* Price */}
                        <p className="text-2xl text-gray-300">
                            {formatPrice(product.price)}
                        </p>

                        {/* Stock Info */}
                        <div className="text-gray-400">
                            <p className="text-sm uppercase tracking-wider">
                                Stock Available: <span className="text-white font-medium">{product.stock}</span>
                            </p>
                        </div>

                        {/* Quantity Selector */}
                        <div className="space-y-4">
                            <p className="text-sm uppercase tracking-wider text-gray-400">Quantity</p>
                            <div className="flex items-center bg-white rounded-full overflow-hidden w-fit">
                                <button
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={quantity <= 1}
                                    className="px-4 py-2 text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    -
                                </button>
                                <span className="px-6 py-2 text-black font-medium min-w-[60px] text-center">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    disabled={quantity >= product.stock}
                                    className="px-4 py-2 text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            {/* Add to Cart */}
                            <button
                                onClick={handleAddToCart}
                                disabled={isAddingToCart || product.stock === 0}
                                className="w-full py-4 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAddingToCart ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>

                            {/* Add to Wishlist */}
                            <button
                                onClick={handleAddToWishlist}
                                disabled={isAddingToWishlist}
                                className="w-full py-4 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAddingToWishlist ? 'Adding...' : 'Add to Wishlist'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Description Section */}
                {product.description && (
                    <div className="mt-12 space-y-4">
                        <h3 className="text-lg font-semibold uppercase tracking-wider">Description</h3>
                        <div className="text-gray-300 leading-relaxed max-w-none">
                            <p className="whitespace-pre-wrap break-words">
                                {product.description}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}