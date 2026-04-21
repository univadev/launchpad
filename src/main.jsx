import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// StrictMode removed: it causes Supabase auth lock conflicts
// (the double-mount in dev triggers the gotrue-js lock timeout bug)
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
