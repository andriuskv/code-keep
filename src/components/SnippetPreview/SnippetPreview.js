import React from "react";
import { Link } from "react-router-dom";
import "./snippet-preview.scss";
import SnippetInfo from "../SnippetInfo";
import SnippetUserLink from "../SnippetUserLink";
import Editor from "../Editor";

export default function SnippetPreview({ snippet, to, children }) {
  return (
    <li className="snippet-preview">
      {snippet.user && <SnippetUserLink user={snippet.user} size="24px"/>}
      <div className="snippet-preview-top">
        <SnippetInfo snippet={snippet}/>
        {children}
      </div>
      <Link to={to} className="snippet-preview-link">
        <Editor file={snippet.files[0]} settings={snippet.settings}
          height={snippet.files[0].height} readOnly preview />
      </Link>
    </li>
  );
}
