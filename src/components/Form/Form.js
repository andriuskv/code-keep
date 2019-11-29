import React, { useState, useEffect } from "react";
import "./form.scss";
import { getRandomString, setDocumentTitle, importEditorMode, resetEditorIndentation, markdownToHtml } from "../../utils";
import { fetchUser } from "../../services/userService";
import { fetchIDBSnippet, saveSnippet } from "../../services/snippetIDBService";
import { fetchServerSnippet, updateServerSnippet, createServerSnippet } from "../../services/snippetServerService";
import { getSetting, getSettings, saveSettings } from "../../services/editor-settings";
import { useUser } from "../../context/user-context";
import SubmitDropdown from "./SubmitDropdown";
import EditorSettings from "./EditorSettings";
import Icon from "../Icon";
import PageSpinner from "../PageSpinner";
import ButtonSpinner from "../ButtonSpinner";
import Editor from "../Editor";
import Markdown from "../Markdown";
import NoMatch from "../NoMatch";
import fileInfo from "../../file-info.json";

export default function Form(props) {
  const [state, setState] = useState({
    loading: true
  });
  const { usernameLowerCase } = useUser();
  const { files } = state;

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    if (props.match.path === "/snippets/:id/edit") {
      const { id } = props.match.params;
      const snippet = await fetchIDBSnippet(id);

      if (snippet) {
        setDocumentTitle(`Editing ${snippet.title}`);
        setState({ ...snippet, fontSize: getSetting("fontSize"), updating: true });
        saveSettings({...getSettings(), ...snippet.settings });
      }
    }
    else if (props.match.path === "/users/:username/:snippetId/edit") {
      const { username, snippetId } = props.match.params;
      const user = await fetchUser(username);

      if (user.code) {
        setState({ error: true });
        return;
      }
      const data = await fetchServerSnippet({
        snippetId,
        userId: user._id,
        status: "edit",
        queryParams: props.location.search
      });

      if (data.code === 401) {
        props.history.replace({
          pathname: "/login",
          search: `?redirect=${props.match.url}`
        });
      }
      else if (data.code === 400 || data.code === 404) {
        setState({ error: true });
      }
      else {
        setDocumentTitle(`Editing ${data.title}`);
        setState({
          ...data,
          fontSize: getSetting("fontSize"),
          username: user.username,
          remote: true,
          updating: true
        });
        saveSettings({...getSettings(), ...data.settings });
      }
    }
    else {
      setDocumentTitle("Create a new snippet");
      setState({
        title: "",
        description: "",
        files: [getNewFile()],
        fontSize: getSetting("fontSize")
      });
    }
  }

  function addFile() {
    files.push(getNewFile());
    setState({ ...state });
  }

  function getNewFile() {
    const type = state.files ? state.files[state.files.length - 1].type : "javascript";
    return {
      id: getRandomString(),
      value: "",
      cm: null,
      ...fileInfo[type]
    };
  }

  async function setEditorInstance({ cm, file }) {
    file.cm = cm;
    setState({ ...state, loaded: true });
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

  async function handleSubmit(snippetType) {
    if (snippetType !== "gist" && !state.title.trim()) {
      setState({ ...state, titleInvalid: true });
      return;
    }
    const { indentSize, indentWithSpaces, wrapLines } = state.settings || getSettings();
    const files = state.files.map((file, index) => ({
      id: file.id,
      name: getFileName(file, index),
      initialName: file.initialName,
      value: file.cm.getValue().trimEnd(),
      displayName: file.displayName,
      extension: file.extension,
      mimeType: file.mimeType,
      mode: file.mode,
      type: file.type
    }));
    const hasUniqueFilenames = new Set(files.map(file => file.name)).size === files.length;

    if (!hasUniqueFilenames) {
      setState({
        ...state,
        submitButtonDisaled: false,
        submitMessage: "File names must be unique."
      });
      return;
    }

    const newSnippet = {
      id: state.id || getRandomString(),
      created: state.created || new Date(),
      title: state.title,
      description: state.description,
      type: state.updating ? state.type : snippetType,
      files,
      settings: {
        indentSize,
        indentWithSpaces,
        wrapLines
      }
    };
    const pathname = usernameLowerCase ? `/users/${usernameLowerCase}` : "/snippets";

    if (state.remote || snippetType !== "local") {
      try {
        if (state.updating || state.type === "gist") {
          const gistFilesToRemove = state.gistFilesToRemove || [];
          newSnippet.files = gistFilesToRemove.concat(newSnippet.files);
        }
        delete state.submitMessage;
        setState({ ...state, submitButtonDisaled: true });
        const callback = state.updating ? updateServerSnippet : createServerSnippet;
        const data = await callback(newSnippet);

        if (data.code === 200) {
          props.history.push({ pathname });
          return;
        }
        setState({
          ...state,
          submitButtonDisaled: false,
          submitMessage: "Something went wrong. Try again later."
        });
      } catch (e) {
        console.log(e);
        setState({
          ...state,
          submitButtonDisaled: false,
          submitMessage: "Something went wrong. Try again later."
        });
      }
    }
    else {
      saveSnippet({ ...newSnippet });
      props.history.push({ pathname });
    }
  }

  function handleInputChange({ target }) {
    const { name, value } = target;
    const data = { [name]: value };

    if (name === "title") {
      data.titleInvalid = !value.trim();
    }
    setState({ ...state, ...data });
  }

  function removeFile(index) {
    if (state.updating && state.type === "gist") {
      state.gistFilesToRemove = state.gistFilesToRemove || [];
      state.gistFilesToRemove.push({
        initialName: files[index].initialName
      });
    }
    files.splice(index, 1);
    setState({ ...state });
  }

  function showSettings() {
    setState({ ...state, settingsVisible: true });
  }

  async function handleFileTypeChange({ target }, index) {
    const file = files[index];
    const info = fileInfo[target.value];
    files[index] = { ...file, ...info };

    if (file.name) {
      files[index].name = getFileName(files[index]);
    }
    await importEditorMode(info.mode);
    file.cm.setOption("mode", info.mode);
    setState({ ...state });
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

      if (state.fontSize !== settings.fontSize) {
        data.fontSize = settings.fontSize;
      }
      requestAnimationFrame(() => {
        updateEditorOptions(settings);
      });
      setState({ ...state, ...data });
    }
  }

  function handleFilenameChange({ target }, index) {
    files[index].name = target.value;
    setState({ ...state });
  }

  async function previewMarkdown(file) {
    if (file.renderAsMarkdown) {
      delete file.markdown;
      delete file.renderAsMarkdown;
    }
    else {
      file.formHeight = file.cm.getWrapperElement().clientHeight;
      file.value = file.cm.getValue().trimEnd();
      file.markdown = await markdownToHtml(file.value);
      file.renderAsMarkdown = true;
    }
    setState({ ...state });
  }

  if (state.loading) {
    return <PageSpinner/>;
  }

  if (state.error) {
    return <NoMatch />;
  }

  return (
    <div className="form" style={{ "--cm-font-size": `${state.fontSize}px` }}>
      <button className="btn icon-text-btn form-settings-btn" onClick={showSettings}>
        <Icon name="settings" />
        <span>Settings</span>
      </button>
      <div className="form-input-group">
        <label className="form-input-group-item">
          <div className="form-input-group-item-title">Title</div>
          <input type="text" className="input" value={state.title} name="title"
            onChange={handleInputChange} disabled={state.type === "gist"}/>
          {state.titleInvalid && <div className="form-input-group-item-error">Required</div>}
        </label>
        <label className="form-input-group-item">
          <div className="form-input-group-item-title">Description</div>
          <input type="text" className="input" value={state.description} name="description"
            onChange={handleInputChange} />
        </label>
      </div>
      {files.map((file, index) => (
        <div className={`form-editor${file.cm ? " visible" : ""}`} key={file.id}>
          <div className="form-editor-toolbar">
            <input type="text" className="input" placeholder="Filename" autoComplete="off"
              spellCheck="false"
              value={file.name}
              onChange={e => handleFilenameChange(e, index)} />
            <select className="select" onChange={e => handleFileTypeChange(e, index)} value={file.type}>
              {Object.keys(fileInfo).map((key, i) => {
                const info = fileInfo[key];
                return <option value={info.type} key={i}>{info.displayName}</option>;
              })}
            </select>
            {file.mode === "gfm" && (
              <button onClick={() => previewMarkdown(file)} title="Preview changes"
                className={`btn icon-btn form-markdown-preview-btn${file.renderAsMarkdown ? " active" : ""}`}>
                <Icon name="eye" />
              </button>
            )}
            {files.length > 1 && (
              <button className="btn icon-btn danger-btn" title="Remove file" onClick={() => removeFile(index)}>
                <Icon name="trash" />
              </button>
            )}
          </div>
          {file.renderAsMarkdown ? <Markdown content={file.markdown} /> :
            <Editor file={file} height={file.formHeight} handleLoad={setEditorInstance} settings={state.settings} />
          }
        </div>
      ))}
      {state.loaded && (
        <div>
          {state.submitMessage && (
            <div className="form-footer-message">{state.submitMessage}</div>
          )}
          <div className="form-footer-btns">
            <button className="btn" onClick={addFile}>Add File</button>
            {state.updating ? (
              <button className="btn form-update-btn"
                disabled={state.submitButtonDisaled} onClick={handleSubmit}>
                <span>Update</span>
                {state.submitButtonDisaled && <ButtonSpinner/>}
              </button>
            ) : (
              <SubmitDropdown username={usernameLowerCase}
                submitButtonDisaled={state.submitButtonDisaled}
                handleSubmit={handleSubmit} />
            )}
          </div>
        </div>
      )}
      {state.settingsVisible && <EditorSettings hide={hideSettings} snippetSettings={state.settings} />}
    </div>
  );
}
