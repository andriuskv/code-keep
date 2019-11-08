import React from "react";
import "./notification.scss";
import Icon from "../Icon";

export default function Notification({ value, type = "negative", className, dismiss }) {
  return (
    <div className={`notification ${type}${className ? ` ${className}` : ""}`}>
      <span>{value}</span>
      <button type="button" className="btn icon-btn notification-btn"
        onClick={dismiss} title="Dismiss">
        <Icon name="close" />
      </button>
    </div>
  );
}
