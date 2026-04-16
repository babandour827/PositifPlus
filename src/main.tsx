import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./i18n/i18n"; // initialise i18next au démarrage

createRoot(document.getElementById("root")!).render(<App />);
