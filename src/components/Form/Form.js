import React, { useState, useEffect } from "react";
import "./form.scss";
import { getRandomString, setDocumentTitle, importEditorMode, resetEditorIndentation } from "../../utils";
import { fetchSnippet } from "../../services/db";
import { getSetting, getSettings, saveSettings } from "../../services/settings";
import Icon from "../Icon";
import Settings from "../Settings";
import Editor from "../Editor";
import fileInfo from "../../file-info.json";

export default function Form(props) {
  const [snippet, setSnippet] = useState({
    title: "",
    description: "",
    files: []
  });
  const { files } = snippet;

  useEffect(() => {
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    const { id } = props.match.params;

    if (id) {
      const snippet = await fetchSnippet(id);

      if (snippet) {
        setDocumentTitle(`Editing ${snippet.title}`);
        setSnippet({ ...snippet, fontSize: getSetting("fontSize"), updating: true });
        saveSettings({...getSettings(), ...snippet.settings });
        return;
      }
    }
    setDocumentTitle("Create a new snippet");
    setSnippet({
      ...snippet,
      files: [getNewFile()],
      fontSize: getSetting("fontSize")
    });
  }

  function addFile() {
    files.push(getNewFile());
    setSnippet({ ...snippet });
  }

  function getNewFile() {
    const { length } = snippet.files;
    return {
      id: getRandomString(),
      value: "",
      cm: null,
      ...fileInfo[length > 1 ? snippet.files[length - 1].type : "javascript"]
    };
  }

  async function setEditorInstance({ cm, file }) {
    file.cm = cm;
    setSnippet({ ...snippet, loaded: true });
  }

  function getFileName({ name, extension }, index) {
    if (name) {
      const arr = name.split(".");

      if (arr[1] !== extension) {
        return `${arr[0]}.${extension}`;
      }
      return name;
    }
    return `file${index + 1}.${extension}`;
  }

  function handleSubmit() {
    if (!snippet.title.trim()) {
      setSnippet({ ...snippet, titleInvalid: true });
      return;
    }
    const { indentSize, indentWithSpaces, wrapLines } = snippet.settings || getSettings();
    const files = snippet.files.map((file, index) => {
      file.value = file.cm.getValue().trimEnd();
      file.name = getFileName(file, index);
      delete file.cm;
      return file;
    });

    props.history.push({
      pathname: "/snippets",
      state: {
        id: snippet.id || getRandomString(),
        created: snippet.created || new Date(),
        title: snippet.title,
        description: snippet.description,
        files,
        settings: {
          indentSize,
          indentWithSpaces,
          wrapLines
        }
      }
    });
  }

  function handleInputChange({ target }) {
    const { name, value } = target;
    const data = { [name]: value };

    if (name === "title") {
      data.titleInvalid = !value.trim();
    }
    setSnippet({ ...snippet, ...data });
  }

  function removeFile(index) {
    files.splice(index, 1);
    setSnippet({ ...snippet });
  }

  function showSettings() {
    setSnippet({ ...snippet, settingsVisible: true });
  }

  async function handleFileTypeChange({ target }, index) {
    const file = files[index];
    const info = fileInfo[target.value];
    files[index] = { ...file, ...info };

    await importEditorMode(info.mode);
    file.cm.setOption("mode", info.mode);
    setSnippet({ ...snippet });
  }

  async function updateEditorOptions({ wrapLines, indentSize, indentWithSpaces }) {
    for (const { cm } of files) {
      cm.setOption("indentUnit", indentSize);
      cm.setOption("tabSize", indentSize);
      cm.setOption("lineWrapping", wrapLines);
      cm.setOption("indentWithTabs", !indentWithSpaces);
      resetEditorIndentation(cm);
      cm.refresh();
    }
  }

  async function hideSettings({ target, currentTarget }, isCloseBtn) {
    if (currentTarget === target || isCloseBtn) {
      const settings = getSettings();
      const data = {
        settingsVisible: false,
        settings
      };

      if (snippet.fontSize !== settings.fontSize) {
        data.fontSize = settings.fontSize;
      }
      requestAnimationFrame(() => {
        updateEditorOptions(settings);
      });
      setSnippet({ ...snippet, ...data });
    }
  }

  function handleFilenameChange({ target }, index) {
    files[index].name = target.value;
    setSnippet({ ...snippet });
  }

  return (
    <div className="form" style={{ "--cm-font-size": `${snippet.fontSize}px` }}>
      <button className="btn icon-text-btn form-settings-btn" onClick={showSettings}>
        <Icon name="settings" />
        <span>Settings</span>
      </button>
      <div className="form-input-group">
        <label className="form-input-group-item">
          <div className="form-input-group-item-title">Title</div>
          <input type="text" className="input" value={snippet.title} name="title"
            onChange={handleInputChange} />
          {snippet.titleInvalid && <div className="form-input-group-item-error">Required</div>}
        </label>
        <label className="form-input-group-item">
          <div className="form-input-group-item-title">Description</div>
          <input type="text" className="input" value={snippet.description} name="description"
            onChange={handleInputChange} />
        </label>
      </div>
      {files.map((file, index) => (
        <div className={`form-editor${file.cm ? " visible" : ""}`} key={file.id}>
          <div className="form-editor-toolbar">
            <input type="text" className="input" placeholder="Filename" autoComplete="off"
              spellCheck="false"
              defaultValue={file.name}
              onChange={e => handleFilenameChange(e, index)} />
            <select className="select" onChange={e => handleFileTypeChange(e, index)} value={file.type}>
              {Object.keys(fileInfo).map((key, i) => {
                const info = fileInfo[key];
                return <option value={info.type} key={i}>{info.displayName}</option>;
              })}
            </select>
            {files.length > 1 && (
              <button className="btn icon-btn danger-btn" title="Remove file" onClick={() => removeFile(index)}>
                <Icon name="trash" />
              </button>
            )}
          </div>
          <Editor file={file} handleLoad={setEditorInstance} settings={snippet.settings} />
        </div>
      ))}
      {snippet.loaded && (
        <div className="form-footer">
          <button className="btn" onClick={addFile}>Add File</button>
          <button className="btn" onClick={handleSubmit}>{snippet.updating ? "Update" : "Create"}</button>
        </div>
      )}
      {snippet.settingsVisible && <Settings hide={hideSettings} snippetSettings={snippet.settings} />}
    </div>
  );
}
