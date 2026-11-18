import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { purgeDemoCatalogOnce } from './data/purgeDemoCatalog'
import './index.css'

purgeDemoCatalogOnce()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
