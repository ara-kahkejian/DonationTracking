import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set initial language from local storage or default to English
const initialLanguage = localStorage.getItem('appLanguage') || 'en';
document.documentElement.lang = initialLanguage;
document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';

createRoot(document.getElementById("root")!).render(<App />);
