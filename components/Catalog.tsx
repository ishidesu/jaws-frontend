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

const ITEMS_PER_PAGE = 15;

export default function Catalog() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [availableVehicleTypes, setAvailableVehicleTypes] = useState<string[]>([]);
    const [availableItemTypes, setAvailableItemTypes] = useState<string[]>([]);
    const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
    const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>([]);
    const [retryCount, setRetryCount] = useState(0);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);
    
    const fetchProducts = async (isRetry = false) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        try {
            if (!isRetry && isMountedRef.current) {
                setIsLoading(true);
                setFetchError(null);
            }
            
            console.log('Fetching products from Supabase...');
            
            const timeoutId = setTimeout(() => {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
            }, 8000);
            
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            clearTimeout(timeoutId);
            
            if (!isMountedRef.current || signal.aborted) {
                return;
            }

            console.log('Supabase response:', { data, error });

            if (error) {
                console.error('Supabase error details:', error);
                setFetchError(`Database error: ${error.message}`);
                
                if (!isRetry && retryCount < 3 && isMountedRef.current) {
                    setRetryCount(prev => prev + 1);
                    setTimeout(() => {
                        if (isMountedRef.current) {
                            fetchProducts(true);
                        }
                    }, 3000);
                }
                return;
            }

            console.log(`Found ${data?.length || 0} total products`);
            
            const productsInStock = data?.filter(p => p.stock > 0) || [];
            console.log(`Found ${productsInStock.length} products in stock`);

            if (isMountedRef.current) {
                setFetchError(null);
                setRetryCount(0);
                setProducts(productsInStock);
                
                const vehicleTypes = [...new Set(productsInStock?.map(p => p.vehicle_type).filter(Boolean) as string[])];
                const itemTypes = [...new Set(productsInStock?.map(p => p.item_type).filter(Boolean) as string[])];
                
                console.log('Available categories:', { vehicleTypes, itemTypes });
                
                setAvailableVehicleTypes(vehicleTypes.sort());
                setAvailableItemTypes(itemTypes.sort());
            }
            
        } catch (error) {
            if (signal.aborted || !isMountedRef.current) {
                return;
            }
            
            console.error('Network/Connection error:', error);
            setFetchError(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            if (!isRetry && retryCount < 3 && isMountedRef.current) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => {
                    if (isMountedRef.current) {
                        fetchProducts(true);
                    }
                }, 3000);
            }
        } finally {
            if (!isRetry && isMountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (!isMountedRef.current) return;
            
            let filtered = products;

            if (searchTerm) {
                filtered = filtered.filter(product =>
                    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }

            if (selectedVehicleTypes.length > 0) {
                filtered = filtered.filter(product =>
                    product.vehicle_type && selectedVehicleTypes.includes(product.vehicle_type)
                );
            }

            if (selectedItemTypes.length > 0) {
                filtered = filtered.filter(product =>
                    product.item_type && selectedItemTypes.includes(product.item_type)
                );
            }

            setFilteredProducts(filtered);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [products, searchTerm, selectedVehicleTypes, selectedItemTypes]);

    useEffect(() => {
        isMountedRef.current = true;
        fetchProducts();
        
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (refreshIntervalRef.current) {
                clearTimeout(refreshIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isLoading && products.length === 0 && isMountedRef.current) {
            refreshIntervalRef.current = setTimeout(() => {
                if (isLoading && products.length === 0 && isMountedRef.current) {
                    console.log('Auto-refreshing page due to long loading time...');
                    window.location.reload();
                }
            }, 8000);
        } else {
            if (refreshIntervalRef.current) {
                clearTimeout(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearTimeout(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
        };
    }, [isLoading, products.length]);

    useEffect(() => {
        if (currentPage > 1) {
            console.log(`Page changed to ${currentPage}, scrolling to top`);
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, [currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handlePageChange = (newPage: number) => {
        console.log(`Setting page to: ${newPage}`);
        setCurrentPage(newPage);
    };

    const formatCategoryName = (category: string) => {
        return category.toUpperCase().replace(/_/g, ' ');
    };

    const getDisplayTitle = () => {
        const allSelected = [...selectedVehicleTypes, ...selectedItemTypes];
        
        if (allSelected.length > 0) {
            return allSelected.map(cat => formatCategoryName(cat)).join(" & ") + ".";
        }
        return "ALL ITEMS.";
    };

    const getBreadcrumb = () => {
        const allSelected = [...selectedVehicleTypes, ...selectedItemTypes];
        
        if (allSelected.length > 0) {
            return `CATALOG / ${allSelected.map(cat => formatCategoryName(cat)).join(" & ")}`;
        }
        return "CATALOG";
    };

    const handleVehicleTypeToggle = (vehicleType: string) => {
        setSelectedVehicleTypes(prev => 
            prev.includes(vehicleType)
                ? prev.filter(type => type !== vehicleType)
                : [...prev, vehicleType]
        );
    };

    const handleItemTypeToggle = (itemType: string) => {
        setSelectedItemTypes(prev => 
            prev.includes(itemType)
                ? prev.filter(type => type !== itemType)
                : [...prev, itemType]
        );
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCategoryDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="px-6 py-8 max-w-7xl mx-auto">
            {/* Filter Section */}
            <div className="mb-8">
                <div className="flex flex-col gap-4 max-w-md">
                    {/* Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search product"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-6 py-4 rounded-full bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 text-base"
                        />
                    </div>
                    
                    {/* Category Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="w-full px-6 py-4 rounded-full bg-white text-black focus:outline-none focus:ring-2 focus:ring-gray-300 text-base text-left flex items-center justify-between"
                        >
                            <span className="text-gray-500">Select a category</span>
                            <svg className="w-4 h-4 fill-current text-gray-600" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showCategoryDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-full max-w-4xl bg-white rounded-lg shadow-lg z-10 p-6">
                                <div className="max-h-[320px] overflow-y-auto category-scroll">
                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Vehicle Types - Left Column */}
                                        <div>
                                            <h3 className="text-black font-semibold mb-4 text-lg">Vehicle Type</h3>
                                            {availableVehicleTypes.length > 0 ? (
                                                <div className="space-y-3">
                                                    {availableVehicleTypes.map((vehicleType) => (
                                                        <label key={vehicleType} className="flex items-center space-x-3 cursor-pointer">
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedVehicleTypes.includes(vehicleType)}
                                                                    onChange={() => handleVehicleTypeToggle(vehicleType)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 border-gray-400 rounded ${selectedVehicleTypes.includes(vehicleType) ? 'bg-black border-black' : 'bg-white'} flex items-center justify-center`}>
                                                                    {selectedVehicleTypes.includes(vehicleType) && (
                                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-black font-medium text-sm">{formatCategoryName(vehicleType)}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No vehicle types available</p>
                                            )}
                                        </div>
                                        
                                        {/* Item Types - Right Column */}
                                        <div>
                                            <h3 className="text-black font-semibold mb-4 text-lg">Item Type</h3>
                                            {availableItemTypes.length > 0 ? (
                                                <div className="space-y-3">
                                                    {availableItemTypes.map((itemType) => (
                                                        <label key={itemType} className="flex items-center space-x-3 cursor-pointer">
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedItemTypes.includes(itemType)}
                                                                    onChange={() => handleItemTypeToggle(itemType)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 border-gray-400 rounded ${selectedItemTypes.includes(itemType) ? 'bg-black border-black' : 'bg-white'} flex items-center justify-center`}>
                                                                    {selectedItemTypes.includes(itemType) && (
                                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-black font-medium text-sm">{formatCategoryName(itemType)}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No item types available</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="mt-6 text-xs text-gray-400 tracking-widest font-light">
                    {getBreadcrumb()}
                </div>
            </div>

            {/* Title Section */}
            <div className="text-center mb-16">
                <h1 className="text-7xl md:text-9xl font-black tracking-wider text-white">
                    {getDisplayTitle()}
                </h1>
            </div>

            {/* Items Grid */}
            <div className="min-h-[800px]">
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-64">
                        <p className="text-2xl text-gray-400 opacity-50 font-light tracking-widest mb-4">
                            LOADING...
                        </p>
                        {fetchError && (
                            <p className="text-lg text-yellow-400 opacity-75 font-light tracking-wider">
                                {fetchError}
                            </p>
                        )}
                        {retryCount > 0 && (
                            <p className="text-sm text-gray-500 opacity-75 font-light tracking-wider mt-2">
                                Retry attempt: {retryCount}/3
                            </p>
                        )}
                        {retryCount >= 3 && (
                            <p className="text-sm text-orange-400 opacity-75 font-light tracking-wider mt-2">
                                Page will refresh automatically...
                            </p>
                        )}
                    </div>
                ) : currentProducts.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64">
                        <p className="text-3xl md:text-4xl text-gray-400 opacity-50 font-light tracking-widest mb-4">
                            NO ITEMS TO DISPLAY.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Products Grid - 3 columns x 5 rows */}
                        <div className="grid grid-cols-3 gap-6 mb-12">
                            {currentProducts.map((product) => (
                                <div 
                                    key={product.id} 
                                    className="group cursor-pointer"
                                    onClick={() => router.push(`/catalog/${product.id}`)}
                                >
                                    {/* Product Image */}
                                    <div className="aspect-[4/3] overflow-hidden hover:border hover:border-gray-600 transition-all duration-300">
                                        <OptimizedImage
                                            src={transformImageUrl(product.image_url)}
                                            alt={product.name}
                                            aspectRatio="aspect-[4/3]"
                                            className="group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    
                                    {/* Product Info */}
                                    <div className="pt-4 text-center">
                                        <h3 className="text-white font-bold text-lg mb-2 uppercase tracking-wider truncate">
                                            {product.name}
                                        </h3>
                                        <p className="text-gray-300 text-sm">
                                            {formatPrice(product.price)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center space-x-2">
                                {/* First Page */}
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                                >
                                    &lt;&lt;
                                </button>
                                
                                {/* Previous Page */}
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                                >
                                    &lt;
                                </button>

                                {/* Page Numbers */}
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-4 py-2 rounded ${
                                                currentPage === pageNum
                                                    ? 'bg-white text-black font-bold'
                                                    : 'text-white hover:text-gray-300'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <span className="text-white px-2">...</span>
                                )}

                                {/* Next Page */}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                                >
                                    &gt;
                                </button>
                                
                                {/* Last Page */}
                                <button
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                                >
                                    &gt;&gt;
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}