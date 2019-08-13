import React, { useState, useEffect } from "react";
import "./form.scss";
import { getRandomString, setDocumentTitle, importEditorMode, resetEditorIndentation } from "../../utils";
import { getSetting, getSettings, saveSettings } from "../../services/settings";
import Icon from "../Icon";
import Settings from "../Settings";
import Editor from "../Editor";

export default function Form(props) {
  const [snippet, setSnippet] = useState({
    title: "",
    description: "",
    files: []
  });
  const { files } = snippet;

  useEffect(() => {
    const { id } = props.match.params;

    if (id) {
      const snippets = JSON.parse(localStorage.getItem("snippets")) || [];
      const snippet = snippets.find(snippet => snippet.id === id);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      mode: {
        name: length > 1 ? snippet.files[length - 1].mode.name : "javascript"
      }
    };
  }

  async function setEditorInstance(instance, id) {
    const file = files.find(file => id === file.id);
    file.cm = instance;
    setSnippet({ ...snippet, loaded: true });
  }

  function handleSubmit() {
    if (!snippet.title.trim()) {
      setSnippet({ ...snippet, titleInvalid: true });
      return;
    }
    const { indentSize, indentWithSpaces, wrapLines } = snippet.settings || getSettings();
    const files = snippet.files.map(file => {
      const newFile = {
        id: file.id,
        mode: file.mode,
        value: file.cm.getValue().trimEnd()
      };

      if (file.name) {
        newFile.name = file.name;
      }
      return newFile;
    });
    const newSnippet = {
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
    };

    props.history.push({
      pathname: "/snippets",
      state: newSnippet
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

  async function handleModeChange({ target }, index) {
    const file = files[index];
    const mode = {
      name: target.value
    };

    await importEditorMode(mode.name);

    file.mode = mode;
    file.cm.setOption("mode", mode);
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
      updateEditorOptions(settings);
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
            <select className="select" onChange={e => handleModeChange(e, index)} value={file.mode.name}>
              <option value="text/x-csrc">C</option>
              <option value="text/x-csharp">C#</option>
              <option value="text/x-c++src">C++</option>
              <option value="text/x-scss">CSS</option>
              <option value="go">Go</option>
              <option value="haskell">Haskell</option>
              <option value="htmlmixed">HTML</option>
              <option value="text/x-java">Java</option>
              <option value="javascript">JavaScript</option>
              <option value="jsx">JSX</option>
              <option value="text/x-kotlin">Kotlin</option>
              <option value="gfm">Markdown</option>
              <option value="text/x-objectivec">Objective-C</option>
              <option value="php">PHP</option>
              <option value="default">Plain Text</option>
              <option value="python">Python</option>
              <option value="ruby">Ruby</option>
              <option value="rust">Rust</option>
              <option value="text/x-scala">Scala</option>
              <option value="text/x-sh">Shell</option>
              <option value="swift">Swift</option>
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