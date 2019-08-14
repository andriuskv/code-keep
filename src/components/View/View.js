import React, { useState, useEffect } from "react";
import "./view.scss";
import { setDocumentTitle } from "../../utils";
import { fetchSnippet } from "../../services/db";
import Icon from "../Icon";
import Editor from "../Editor";
import DateDiff from "../DateDiff";

export default function View(props) {
  const [snippet, setSnippet] = useState(null);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    const { id } = props.match.params;

    if (id) {
      const snippet = await fetchSnippet(id);

      if (snippet) {
        setDocumentTitle(snippet.title);
        setSnippet(snippet);
      }
      else {
        props.history.replace("/snippets");
      }
    }
  }

  function handleLoad() {
    snippet.loaded = true;
    setSnippet({ ...snippet });
  }

  function copyFileContent(value) {
    navigator.clipboard.writeText(value).catch(error => {
      console.log(error);
    });
  }

  function downloadFile(file) {
    const url = URL.createObjectURL(new Blob([file.value], { type: file.mimeType }));
    const link = document.createElement("a");
    link.download = file.name;
    link.href = url;
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 100);
  }

  async function downloadFiles() {
    const [{ saveAs }, { default: JSZip }] = await Promise.all([import("file-saver"), import("jszip")]);
    const zip = new JSZip();

    snippet.files.forEach(file => {
      zip.folder("files").file(file.name, new Blob([file.value], { type: file.mimeType }));
    });
    const archive = await zip.generateAsync({ type:"blob" });
    saveAs(archive, "files.zip");
  }

  if (!snippet) {
    return null;
  }
  return (
    <div className="view">
      <div className="view-header">
        <div>
          <h2 className="view-title">{snippet.title}</h2>
          {snippet.description && (
            <p className="view-description">{snippet.description}</p>
          )}
          <div className="view-date"><DateDiff start={snippet.created} /></div>
        </div>
        <button onClick={downloadFiles} className="btn view-header-btn">Download ZIP</button>
      </div>
      {snippet.files.map(file => (
        <div className={`view-editor${snippet.loaded ? " loaded" : ""}`} key={file.id}>
          {file.name && (
            <div className="view-editor-header">
              <Icon name="file" />
              <span className="view-editor-header-filename">{file.name}</span>
              <button onClick={() => copyFileContent(file.value)}
                className="btn icon-text-btn view-editor-header-btn">
                <Icon name="clipboard" />
                <span>Copy</span>
              </button>
              <button onClick={() => downloadFile(file)}
                className="btn icon-text-btn view-editor-header-btn">
                <Icon name="download" />
                <span>Download</span>
              </button>
            </div>
          )}
          <Editor file={file} settings={snippet.settings} handleLoad={handleLoad} readOnly />
        </div>
      ))}
    </div>
  );
}
