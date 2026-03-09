"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function Section({ children, className, delay = 0.2 }: SectionProps) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay, ease: "easeOut" }}
            className={cn(
                "min-h-[80vh] flex flex-col items-center justify-center p-6 sm:p-12 text-center max-w-3xl mx-auto",
                className
            )}
        >
            {children}
        </motion.section>
    );
}
