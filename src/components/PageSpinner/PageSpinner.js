import React from "react";
import "./page-spinner.scss";
import spinner from "../../assets/ring.svg";

export default function PageSpinner() {
  return <img src={spinner} className="page-spinner" alt="" />;
}
