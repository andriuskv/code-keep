import React from "react";
import "./file-header-dropdown.scss";
import Dropdown from "../../Dropdown";
import Icon from "../../Icon";
import fileInfo from "../../../data/file-info.json";

export default function FileHeaderDropdown({ file, previewMarkdown }) {
  function copyFileContent(value) {
    navigator.clipboard.writeText(value).catch(error => {
      console.log(error);
    });
  }

  function downloadFile(file) {
    const { mimeType } = fileInfo[file.type];
    const url = URL.createObjectURL(new Blob([file.value], { type: mimeType }));
    const link = document.createElement("a");
    link.download = file.name;
    link.href = url;
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 100);
  }

  return (
    <Dropdown
      toggle={{ content: <Icon name="dots" />, title: "Toggle action menu", className: "btn icon-btn view-editor-header-menu-toggle-btn" }}
      body={{ className: "view-editor-header-menu-items" }}>
      {file.mode === "gfm" && (
        <button onClick={() => previewMarkdown(file)}
          className={`btn icon-text-btn dropdown-btn view-editor-header-btn${file.renderAsMarkdown ? " active" : ""}`}>
          <Icon name="eye" />
          <span>Preview</span>
        </button>
      )}
      <button onClick={() => copyFileContent(file.value)}
        className="btn icon-text-btn dropdown-btn view-editor-header-btn">
        <Icon name="clipboard" />
        <span>Copy</span>
      </button>
      <button onClick={() => downloadFile(file)}
        className="btn icon-text-btn dropdown-btn view-editor-header-btn">
        <Icon name="download" />
        <span>Download</span>
      </button>
    </Dropdown>
  );
}
