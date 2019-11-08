import React from "react";
import "./button-spinner.scss";
import spinner from "../../assets/ring.svg";

export default function ButtonSpinner() {
  return <img src={spinner} className="btn-spinner" alt="" />;
}
