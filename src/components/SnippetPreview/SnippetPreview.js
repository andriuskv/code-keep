import React from "react";
import { Link } from "react-router-dom";
import "./snippet-preview.scss";
import SnippetInfo from "../SnippetInfo";
import SnippetUserLink from "../SnippetUserLink";
import Markdown from "../Markdown";
import Editor from "../Editor";

export default function SnippetPreview({ snippet, to, children }) {
  const [file] = snippet.files;

  if (file.type === "markdown") {
    file.value = file.value.split("\n").slice(0, 10).join("\n");
  }

  return (
    <li className="snippet-preview">
      {snippet.user && <SnippetUserLink user={snippet.user} size="24px"/>}
      <div className="snippet-preview-top">
        <SnippetInfo snippet={snippet}/>
        {children}
      </div>
      <Link to={to} className="snippet-preview-link">
        {file.type === "markdown" ?
          <Markdown className="snippet-markdown-preview" file={file}/> :
          <Editor file={file} settings={snippet.settings} readOnly preview/>
        }
      </Link>
    </li>
  );
}
