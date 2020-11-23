import ReactDOM from "react-dom";

import "focus-visible";
import "normalize.css";
import "./styles/index.scss";

import App from "./components/App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

ReactDOM.render(<App/>, document.getElementById("root"));

serviceWorkerRegistration.register();
