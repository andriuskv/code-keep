import { useState, useEffect } from "react";
import "./notification.scss";
import { classNames } from "../../utils";
import Icon from "../Icon";

export default function Notification({ notification, dismiss, margin }) {
  const [state, setState] = useState(notification);
  const type = notification.type || "negative";

  useEffect(() => {
    if (!state.flashing && state !== notification) {
      if (state.value !== notification.value) {
        setState(notification);
        return;
      }
      setState({ ...state, flashing: true });

      setTimeout(() => {
        setState(notification);
      }, 640);
    }
  }, [state, notification]);

  return (
    <div className={classNames("notification", type, `margin-${margin}`, state.flashing ? "flash" : "")}>
      <Icon name={type === "negative" ? "circle-cross" : "circle-check"} className="notification-icon"/>
      <span className="notification-text">{state.value}</span>
      <button type="button" className="btn icon-btn notification-btn"
        onClick={dismiss} title="Dismiss">
        <Icon name="close"/>
      </button>
    </div>
  );
}
