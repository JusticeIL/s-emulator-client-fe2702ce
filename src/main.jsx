import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

console.log("App is loading...");
createRoot(document.getElementById("root")).render(<App />);
