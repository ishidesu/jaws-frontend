"use client";

import { useState, useRef, useEffect } from "react";

interface OptimizedImageProps {
    src: string | null;
    alt: string;
    className?: string;
    fallback?: React.ReactNode;
    aspectRatio?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export default function OptimizedImage({ 
    src, 
    alt, 
    className = "", 
    fallback,
    aspectRatio = "aspect-square",
    objectFit = "cover"
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!src) {
            setIsLoading(false);
            setHasError(true);
            return;
        }

        setIsLoading(true);
        setHasError(false);
        setImageSrc(null);

        const img = new Image();
        
        img.onload = () => {
            setImageSrc(src);
            setIsLoading(false);
            setHasError(false);
        };
        
        img.onerror = () => {
            setIsLoading(false);
            setHasError(true);
        };
        
        img.src = src;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    const defaultFallback = (
        <div className="text-gray-400 text-center flex flex-col items-center justify-center h-full">
            <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">No Image</p>
        </div>
    );

    return (
        <div className={`${aspectRatio} bg-gray-900 flex items-center justify-center overflow-hidden relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                    <div className="text-gray-500 text-center">
                        <svg className="w-8 h-8 mx-auto mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="text-xs">Loading...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {hasError && !isLoading && (
                fallback || defaultFallback
            )}

            {/* Actual Image */}
            {imageSrc && !hasError && (
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt={alt}
                    className={`w-full h-full transition-all duration-300 ${
                        isLoading ? 'opacity-0' : 'opacity-100'
                    } ${className}`}
                    style={{ objectFit }}
                    loading="lazy"
                    decoding="async"
                />
            )}
        </div>
    );
}