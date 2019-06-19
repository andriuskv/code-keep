import React, { useState, useEffect } from "react";
import "./view.scss";
import Editor from "../Editor";
import DateDiff from "../DateDiff";

export default function View(props) {
  const [snippet, setSnippet] = useState(null);

  useEffect(() => {
    const { id } = props.match.params;

    if (id) {
      const snippets = JSON.parse(localStorage.getItem("snippets")) || [];
      const snippet = snippets.find(snippet => snippet.id === id);

      if (snippet) {
        setSnippet(snippet);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLoad() {
    snippet.loaded = true;
    setSnippet({ ...snippet });
  }

  if (!snippet) {
    return null;
  }
  return (
    <div className="view">
      <h2 className="view-title">{snippet.title}</h2>
      {snippet.description && (
        <p className="view-description">{snippet.description}</p>
      )}
      <div className="view-date"><DateDiff start={snippet.created} /></div>
      {snippet.files.map(file => (
        <div className={`view-editor${snippet.loaded ? " loaded" : ""}`} key={file.id}>
          {file.name && (
            <div className="view-editor-header">
              <span>{file.name}</span>
            </div>
          )}
          <Editor file={file} settings={snippet.settings} handleLoad={handleLoad} readOnly />
        </div>
      ))}
    </div>
  );
}
