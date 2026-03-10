import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  error?: boolean;
  disabled?: boolean;
}

export default function Combobox({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select option", 
  className = "",
  buttonClassName = "",
  error = false,
  disabled = false
}: ComboboxProps) {
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
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    const handleScroll = (e: Event) => {
       // Ignore scroll events inside the dropdown itself
       if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
       if(isOpen) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    return options.filter(option => 
      String(option.label).toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === "") return null;
    return options.find(o => String(o.value) === String(value)) || null;
  }, [options, value]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between ${buttonClassName || "pl-10"} pr-3 py-1.5 border rounded-md transition-all
          ${error ? "border-red-500 ring-red-100" : "border-gray-300 focus:ring-gray-100"}
          ${isOpen ? "ring-2 ring-gray-100 border-gray-400" : ""}
          ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white"}
          focus:outline-none text-left min-h-[38px] text-sm`}
      >
        <span className={`block truncate ${!selectedOption ? "text-gray-400" : "text-gray-900"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
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
                position: "absolute",
                top: position.top,
                left: position.left,
                width: position.width,
                zIndex: 9999 
              }}
              className="bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
            >
              <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    ref={searchInputRef}
                  />
                </div>
              </div>

              <ul className="max-h-40 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {filteredOptions.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-gray-500 text-center">No results found.</li>
                ) : (
                  filteredOptions.map((option, idx) => {
                    const isSelected = String(option.value) === String(value);
                    return (
                      <li
                        key={`${option.value}-${idx}`}
                        onClick={() => {
                          onChange(String(option.value));
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors
                          ${isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"}
                        `}
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check size={14} className="text-blue-600" />}
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
