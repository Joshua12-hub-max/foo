import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from './App'
import './index.css'

// 100% COMPATIBILITY: Expose React and ReactDOM globally for Zoom Meeting SDK
// The Zoom SDK (UMD version) expects these to be available on the window object
// to avoid "Cannot read properties of undefined (reading 'ReactCurrentOwner')" errors.
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "929118354380-oasjidbiimh64ndksvctmkv2p2euqhab.apps.googleusercontent.com";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Customize as needed
      retry: 1
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
)
