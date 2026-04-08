import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface ComboboxProps<T extends string> {
  options: readonly Option<T>[];
  value: T | undefined | null;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  error?: boolean;
  disabled?: boolean;
}

export default function Combobox<T extends string>({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select option", 
  className = "",
  buttonClassName = "",
  error = false,
  disabled = false
}: ComboboxProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Measure button position for portal
  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Focus search input without scrolling when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus({ preventScroll: true });
    }
  }, [isOpen]);

  // Handle outside click & scroll (to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        dropdownRef.current && 
        target instanceof Node &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    const handleScroll = (e: Event) => {
       const target = e.target;
       // Ignore scroll events inside the dropdown itself
       if (dropdownRef.current && target instanceof Node && dropdownRef.current.contains(target)) return;
       
       requestAnimationFrame(() => {
           if (buttonRef.current && dropdownRef.current) {
               const rect = buttonRef.current.getBoundingClientRect();
               dropdownRef.current.style.top = `${rect.bottom + 8}px`;
               dropdownRef.current.style.left = `${rect.left}px`;
               dropdownRef.current.style.width = `${rect.width}px`;
           }
       });
    };

    const handleResize = () => {
       if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setPosition({
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width
          });
       }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    return options.filter(option => 
      String(option.label).toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find(o => String(o.value) === String(value)) || null;
  }, [options, value]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border-2 rounded-lg transition-all active:scale-[0.99]
          ${error ? "border-red-400 ring-4 ring-red-50" : "border-gray-300 focus:ring-4 focus:ring-gray-100"}
          ${isOpen ? "ring-4 ring-green-100 border-green-500 shadow-lg" : "hover:border-gray-400"}
          ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white hover:shadow-md"}
          ${buttonClassName} px-4 py-3 md:py-2.5 focus:outline-none text-left min-h-[48px] md:min-h-[44px] text-[15px] md:text-sm font-medium`}
      >
        <span className={`block truncate ${!selectedOption ? "text-gray-400" : "text-gray-900 font-semibold"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: position.width,
                zIndex: 9999,
                maxWidth: "100vw"
              }}
              className="bg-white border-2 border-gray-300 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-3 border-b-2 border-gray-100 sticky top-0 bg-white z-10">
                 <div className="relative">
                    <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search options..."
                    className="w-full px-4 py-3 text-sm font-semibold bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                    ref={searchInputRef}
                  />
                </div>
              </div>

              <ul className="max-h-[300px] md:max-h-[280px] overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                  style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch'
                  }}
              >
                {filteredOptions.length === 0 ? (
                  <li className="px-4 py-6 text-base text-gray-500 text-center font-medium">No results found.</li>
                ) : (
                  filteredOptions.map((option, idx) => {
                    const isSelected = String(option.value) === String(value);
                    return (
                      <li
                        key={`${String(option.value)}-${idx}`}
                        onClick={() => {
                          onChange(option.value);
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`px-4 py-3.5 text-[15px] md:text-sm cursor-pointer flex items-center justify-between transition-all active:scale-[0.98]
                          ${isSelected
                            ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-500"
                            : "text-gray-700 hover:bg-gray-100 font-medium border-l-4 border-transparent"}
                        `}
                      >
                        <span className="flex-1 pr-2">{option.label}</span>
                        {isSelected && (
                          <span className="text-[10px] font-black text-green-600 tracking-wider uppercase bg-green-100 px-2 py-1 rounded">
                            ✓
                          </span>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
