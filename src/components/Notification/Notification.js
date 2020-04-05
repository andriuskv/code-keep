import React, { useState, useEffect } from "react";
import "./notification.scss";
import Icon from "../Icon";

export default function Notification({ notification, className, dismiss }) {
  const [state, setState] = useState(notification);

  useEffect(() => {
    if (!state.flashing && state !== notification) {
      if (state.type !== notification.type) {
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
    <div className={`notification ${state.type || "negative"}${className ? ` ${className}` : ""}${state.flashing ? " flash": ""}`}>
      <Icon name={state.type === "negative" ? "circle-cross" : "circle-check"}/>
      <span className="notification-text">{state.value}</span>
      <button type="button" className="btn icon-btn notification-btn"
        onClick={dismiss} title="Dismiss">
        <Icon name="close"/>
      </button>
    </div>
  );
}
