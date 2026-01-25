import { useState, useEffect, useMemo, ReactNode } from "react";
import { useLocation } from "react-router-dom";

// NOTE: `quotes.json` can be large. Dynamically import it so it doesn't
// bloat the initial auth chunk. It will be loaded only when the AuthLayout
// actually mounts.

const QUOTE_TRANSITION_DURATION = 700;
const QUOTE_DISPLAY_DURATION = 15000;
const DEFAULT_LOGO = "/Logo.Municipal of Meycuayan.png";

interface Quote {
  quoteText: string;
  quoteAuthor: string;
}

interface AnimatedQuoteProps {
  quote: Quote;
  fadeIn: boolean;
}

const AnimatedQuote = ({ quote, fadeIn }: AnimatedQuoteProps) => (
  <div className="absolute left-6 bottom-6 right-6 text-left">
    <p
      className={`text-base italic text-slate-200 font-medium leading-relaxed transition-opacity duration-700 ${
        fadeIn ? "opacity-100" : "opacity-0"
      }`}
    >
      "{quote.quoteText}"
    </p>
    {quote.quoteAuthor && (
      <p 
        className={`text-sm mt-2 text-slate-400 font-semibold transition-opacity duration-700 ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        — {quote.quoteAuthor}
      </p>
    )}
  </div>
);

const BrandingSection = () => (
  <div className="max-w-4xl text-center space-y-6 px-4">
    <img 
      src={DEFAULT_LOGO}
      alt="Meycauayan Logo" 
      className="w-56 h-56 mx-auto object-contain mb-4 transition-transform duration-300 hover:scale-105"
    />
    <h2 className="text-3xl font-extrabold text-slate-50 mb-2 tracking-wide drop-shadow-lg">
      City Human Resources Management Office
    </h2>
    <p className="text-lg leading-relaxed text-slate-300">
      A centralized{" "}
      <span className="font-semibold text-white">
        Human Resource Employee Management System
      </span>{" "}
      for the City Government of Meycauayan, Bulacan.
    </p>
  </div>
);

interface FormHeaderProps {
  image?: string;
  title: string;
  subtitle?: string;
}

const FormHeader = ({ image, title, subtitle }: FormHeaderProps) => (
  <div className="flex flex-col items-center justify-center gap-2 mb-4">
    <img 
      src={image ?? DEFAULT_LOGO} 
      alt="Municipal of Meycauayan Logo" 
      className="w-12 h-12 rounded-lg object-contain" 
    />
    <h1 className="font-bold text-slate-950 text-xl text-center">
      {title}
    </h1>
    {subtitle && (
      <p className="text-xs text-slate-500 text-center">{subtitle}</p>
    )}
  </div>
);

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  image?: string;
  showQuotes?: boolean;
  showBranding?: boolean;
  leftBgGradient?: string;
}

/**
 * AuthLayout - Optimized authentication layout component
 */
export default function AuthLayout({
  children,
  title,
  subtitle,
  image,
  showQuotes = true,
  showBranding = true,
  leftBgGradient = "from-slate-950 to-slate-900"
}: AuthLayoutProps) {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const location = useLocation();

  // Load quotes dynamically to avoid bundling huge JSON into initial chunk
  useEffect(() => {
    let mounted = true;
    import("@/data/quotes_small.json")
      .then((m) => {
        // @ts-ignore
        if (mounted) setQuotes(m.default || m);
      })
      .catch(() => {
        if (mounted) setQuotes([]);
      });

    return () => { mounted = false; };
  }, []);

  // Current quote object
  const quote = useMemo(() => 
    quotes?.[currentQuote] ?? { quoteText: "", quoteAuthor: "" },
    [currentQuote, quotes]
  );

  // Determine if current page is login
  const isLoginPage = useMemo(() => 
    location.pathname === "/login", 
    [location.pathname]
  );

  // Auto-generate title based on page type
  const pageTitle = useMemo(() => 
    title ?? (isLoginPage ? "Login your Account" : "Register your Account"),
    [title, isLoginPage]
  );

  // Check if quotes are available
  const hasQuotes = useMemo(() => 
    Array.isArray(quotes) && quotes.length > 0,
    [quotes]
  );

  useEffect(() => {
    if (!showQuotes || !hasQuotes) return;

    const interval = setInterval(() => {
      setFadeIn(false);

      const timeoutId = setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % quotes.length);
        setFadeIn(true);
      }, QUOTE_TRANSITION_DURATION);

      // Cleanup nested timeout
      return () => clearTimeout(timeoutId);
    }, QUOTE_DISPLAY_DURATION);

    return () => clearInterval(interval);
  }, [showQuotes, hasQuotes]);

  return (
    <div className="min-h-screen flex bg-gradient-to-r from-slate-950 to-green-900 text-slate-100">
      {/* Left Section - Hero/Branding */}
      <div className={`hidden md:flex relative w-3/4 bg-gradient-to-r from-slate-950 to-green-900 items-center justify-center p-12 shadow-inner overflow-hidden`}>
        {showBranding && <BrandingSection />}
        
        {/* Rotating Quote */}
        {showQuotes && hasQuotes && (
          <AnimatedQuote quote={quote} fadeIn={fadeIn} />
        )}
      </div>

      {/* Right Section - Form Container */}
      <div className="flex flex-col justify-center w-full md:w-1/2 bg-white p-4 sm:p-6">
        <div className="max-w-sm mx-auto w-full">
          <div className="bg-white border border-gray-200 rounded-[15px] shadow-lg p-5 sm:p-6 text-gray-800 hover:shadow-2xl transition-shadow duration-200">
            <FormHeader 
              image={image} 
              title={pageTitle} 
              subtitle={subtitle} 
            />
            
            {/* Form Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
