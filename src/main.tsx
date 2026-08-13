import "./faro";  
import { createRoot } from "react-dom/client";  
import App from "./App.tsx";  
import "./globals.css";  

createRoot(document.getElementById("root")!).render();  

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

createRoot(document.getElementById("root")!).render(<App />);
