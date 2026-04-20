import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerWindowHelpers } from "./lib/wipe";

registerWindowHelpers();

createRoot(document.getElementById("root")!).render(<App />);
