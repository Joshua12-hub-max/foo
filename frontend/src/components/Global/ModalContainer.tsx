import React, { Suspense, useEffect } from 'react';
import { useModalStore } from '@/stores/modalStore';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Maps string identifiers to actual components
// In a real app, you might use lazy loading here or a registry
// For now, we'll keep it simple and extensible
const ModalRegistry: Record<string, React.ComponentType<Record<string, unknown>>> = {
  // Add your modal components here
  // 'example-modal': ExampleModalComponent,
};

const ModalContainer: React.FC = () => {
  const { modals, closeModal } = useModalStore();

  if (modals.length === 0) return null;

  return createPortal(
    <>
      {modals.map((modal, index) => {
        // Fallback or registry lookup
        const Component = ModalRegistry[modal.component];
        const isTop = index === modals.length - 1;

        if (!Component) {
            // If component not found in registry, maybe it was passed as a prop locally (less common in strict serializable store)
             // For this implementation plan, we assume registry or dynamic import usage in future.
             // As a fallback for development:
             return null; 
        }

        return (
          <div 
            key={modal.id}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 transition-opacity"
              onClick={() => closeModal(modal.id)}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                    <Component {...(modal.props as Record<string, unknown>)} onClose={() => closeModal(modal.id)} />
                </Suspense>
            </div>
          </div>
        );
      })}
    </>,
    document.body
  );
};

export default ModalContainer;
