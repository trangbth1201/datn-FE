import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './style/styles.scss'
import App from './App'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom' 
import { AuthProvider } from './auth/AuthContext '

const queryClient = new QueryClient()
const clientId = "722000405898-5olhskhe32kqcfbnq31s6jp2bphtpqst.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter> 
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
