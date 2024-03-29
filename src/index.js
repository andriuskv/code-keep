import { createRoot } from "react-dom/client";

import "focus-visible";
import "normalize.css";
import "./styles/index.scss";

import App from "./components/App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = createRoot(document.getElementById("root"));

root.render(<App/>);

serviceWorkerRegistration.register();
