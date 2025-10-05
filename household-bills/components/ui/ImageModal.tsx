"use client";

import { useState, ReactNode, useEffect } from "react";
import Image from "next/image";

interface ImageModalProps {
  src: string;
  alt: string;
  children: ReactNode;
}

export default function ImageModal({ src, alt, children }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-4xl font-light"
              aria-label="Close modal"
            >
              ×
            </button>

            {/* Enlarged Image */}
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="max-h-[90vh] w-auto object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
