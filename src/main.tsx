import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const saved = localStorage.getItem('kotch-theme') ?? 'system';
if (saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
