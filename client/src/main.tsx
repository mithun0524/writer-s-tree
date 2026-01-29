import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
// Temporarily disabled Clerk for testing
// import { ClerkProvider } from '@clerk/clerk-react'

// const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// if (!PUBLISHABLE_KEY) {
//   throw new Error("Missing Clerk Publishable Key")
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Temporarily disabled Clerk provider */}
    {/* <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider> */}
    <App />
  </StrictMode>,
)
