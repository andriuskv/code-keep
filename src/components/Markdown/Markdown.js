import React from "react";
import { Markup } from "interweave";
import "./markdown.scss";

export default function Header({ content }) {
  return <div className="markdown-body"><Markup content={content} /></div>;
}
