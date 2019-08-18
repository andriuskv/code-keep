import React, { useState, useEffect } from "react";
import "./view.scss";
import { setDocumentTitle, markdownToHtml } from "../../utils";
import { saveSnippet, fetchSnippet } from "../../services/db";
import Icon from "../Icon";
import Dropdown from "./Dropdown";
import Editor from "../Editor";
import DateDiff from "../DateDiff";
import Markdown from "../Markdown";

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

  function handleLoad({ file, height }) {
    if (file.height !== height) {
      file.height = height;
      setSnippet({ ...snippet });
      saveSnippet(snippet);
    }
  }

  async function downloadFiles() {
    const [{ saveAs }, { default: JSZip }] = await Promise.all([
      import("file-saver"),
      import("jszip")
    ]);
    const zip = new JSZip();

    snippet.files.forEach(file => {
      zip.folder("files").file(file.name, new Blob([file.value], { type: file.mimeType }));
    });
    const archive = await zip.generateAsync({ type:"blob" });
    saveAs(archive, `${snippet.title}.zip`);
  }

  async function previewMarkdown(file) {
    if (file.renderAsMarkdown) {
      delete file.markdown;
      delete file.renderAsMarkdown;
    }
    else {
      file.markdown = await markdownToHtml(file.value);
      file.renderAsMarkdown = true;
    }
    setSnippet({ ...snippet });
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
        <div className="view-editor" key={file.id}>
          <div className="view-editor-header">
            <Icon name="file" />
            <span className="view-editor-header-filename">{file.name}</span>
            <Dropdown file={file} previewMarkdown={previewMarkdown} />
          </div>
          {file.renderAsMarkdown ? <Markdown content={file.markdown} /> :
            <Editor file={file} settings={snippet.settings}
              height={file.height} handleLoad={handleLoad} readOnly />
          }
        </div>
      ))}
    </div>
  );
}
