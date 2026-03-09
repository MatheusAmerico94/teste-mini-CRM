"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
    images: string[];
    columns?: 1 | 2 | 3; // Mantido por compatibilidade com Props antigas, embora agora seja carrossel
}

export function PhotoGallery({ images }: PhotoGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-play a cada 5 segundos
    useEffect(() => {
        if (images.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [images.length]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!images || images.length === 0) return null;

    return (
        <div className="w-full max-w-2xl mx-auto mt-12 mb-8 relative group">
            <div className="relative aspect-[4/5] sm:aspect-video overflow-hidden rounded-2xl shadow-xl border-4 border-white bg-gray-100">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentIndex}
                        src={images[currentIndex]}
                        alt={`Slide ${currentIndex + 1}`}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="w-full h-full object-cover"
                    />
                </AnimatePresence>

                {/* Setas de navegação */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/40"
                            aria-label="Foto anterior"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/40"
                            aria-label="Próxima foto"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}

                {/* Indicadores (Bolinhas) */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    idx === currentIndex
                                        ? "bg-white w-4"
                                        : "bg-white/50 hover:bg-white/80"
                                )}
                                aria-label={`Ir para a foto ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
