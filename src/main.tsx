import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./i18n/i18n"; // initialise i18next au démarrage

// Appliquer la taille de police sauvegardée
const savedFontSize = localStorage.getItem("pp_fontsize");
if (savedFontSize === "large") document.documentElement.style.fontSize = "18px";

createRoot(document.getElementById("root")!).render(<App />);
