import { useState, useEffect, useRef } from "react";
import "./form.scss";
import { GENERIC_ERROR_MESSAGE } from "../../messages";
import { getRandomString, setDocumentTitle, getStringSize, importEditorMode, resetEditorIndentation, markdownToHtml } from "../../utils";
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
import fileInfo from "../../data/file-info.json";

export default function Form(props) {
  const { usernameLowerCase, role: userRole } = useUser();
  const [state, setState] = useState({
    loading: true
  });
  const newFileBtnRef = useRef();
  const fileModeTimeout = useRef();
  const sizeTimeout = useRef();
  const formDirty = useRef(false);
  const { files } = state;

  useEffect(() => {
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload, { capture: true });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!state.loaded) {
      return;
    }

    function handleChange(cm, file) {
      clearTimeout(sizeTimeout.current);
      sizeTimeout.current = setTimeout(() => {
        const { size, sizeString } = getStringSize(cm.getValue());

        file.size = size;
        file.sizeString = sizeString;

        setState({ ...state });
      }, 400);
    }

    for (const file of state.files) {
      if (file.cm) {
        if (file.cm._handlers) {
          file.cm.off("change", file.cm._handlers.change[0]);
        }
        file.cm.on("change", cm => handleChange(cm, file));
      }
    }
  }, [state]);

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
      const data = await fetchServerSnippet({
        snippetId,
        username,
        status: "edit",
        queryParams: props.location.search
      });

      if (data.code === 401) {
        props.history.replace({
          pathname: "/login",
          search: `?redirect=${props.location.pathname + props.location.search}`
        });
      }
      else if (data.code === 404 || data.code === 500) {
        setState({ error: true });
      }
      else {
        setDocumentTitle(`Editing ${data.title}`);
        setState({
          ...data,
          fontSize: getSetting("fontSize"),
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

  function handleBeforeUnload(event) {
    if (formDirty.current) {
      event.preventDefault();
      event.returnValue = "You have unsaved changes. Leave anyway?";
      return event.returnValue;
    }
  }

  function handleKeypress() {
    formDirty.current = true;
  }

  function addFile() {
    files.push(getNewFile());
    setState({ ...state });
    requestAnimationFrame(() => {
      newFileBtnRef.current.scrollIntoView();
    });
  }

  function getNewFile() {
    return {
      id: getRandomString(),
      name: "",
      value: "",
      cm: null,
      sizeString: getStringSize("").sizeString,
      type: state.files ? state.files[state.files.length - 1].type : "javascript"
    };
  }

  function setEditorInstance({ cm, file }) {
    file.cm = cm;
    setState({ ...state, loaded: true });
  }

  function getFileName({ name, type }, index) {
    const { extension } = fileInfo[type];

    if (name) {
      const arr = name.split(".");

      if (arr[1]) {
        return name;
      }
      return `${arr[0]}.${extension}`;
    }
    return `file${index + 1}.${extension}`;
  }

  async function handleSubmit(snippetType) {
    snippetType = typeof snippetType === "string" ? snippetType : state.type;

    if (snippetType !== "gist" && !state.title.trim()) {
      setState({ ...state, titleInvalid: true });
      return;
    }
    const { indentSize, indentWithSpaces, wrapLines } = state.settings || getSettings();
    const files = state.files.map((file, index) => {
      const value = file.cm.getValue().trimEnd();
      const { size, sizeString } = getStringSize(value);
      const newFile = {
        id: file.id,
        name: getFileName(file, index),
        type: file.type,
        value,
        size,
        sizeString
      };

      if (file.initialName) {
        newFile.initialName = file.initialName;
      }
      return newFile;
    });
    const hasUniqueFilenames = new Set(files.map(file => file.name)).size === files.length;

    if (!hasUniqueFilenames) {
      setState({
        ...state,
        disabledSubmitButton: "",
        submitMessage: "File names must be unique."
      });
      return;
    }

    const newSnippet = {
      id: state.id || getRandomString(),
      title: state.title,
      description: state.description,
      createdAt: state.createdAt,
      type: state.updating ? state.type : snippetType,
      files,
      settings: {
        indentSize,
        indentWithSpaces,
        wrapLines
      }
    };
    const pathname = usernameLowerCase ? `/users/${usernameLowerCase}` : "/snippets";
    const currentDate = Date.now();

    if (!newSnippet.createdAt) {
      newSnippet.createdAt = currentDate;
    }
    newSnippet.modifiedAt = currentDate;

    if (snippetType === "local") {
      saveSnippet({ ...newSnippet });
      props.history.push({ pathname });
      return;
    }
    try {
      if (state.updating && snippetType) {
        const gistFilesToRemove = state.gistFilesToRemove || [];
        newSnippet.files = gistFilesToRemove.concat(newSnippet.files);
        newSnippet.username = userRole === "admin" ? props.match.params.username : undefined;
      }
      delete state.submitMessage;
      setState({ ...state, disabledSubmitButton: snippetType });
      const callback = state.updating ? updateServerSnippet : createServerSnippet;
      const data = await callback(newSnippet);

      if (data.code === 200 || data.code === 201) {
        props.history.push({ pathname });
        return;
      }
      setState({
        ...state,
        disabledSubmitButton: "",
        submitMessage: data.message || GENERIC_ERROR_MESSAGE
      });
    } catch (e) {
      console.log(e);
      setState({
        ...state,
        disabledSubmitButton: "",
        submitMessage: GENERIC_ERROR_MESSAGE
      });
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
    const { extension, mode } = fileInfo[target.value];

    if (file.name) {
      const arr = file.name.split(".");

      if (arr[1] !== extension) {
        file.name = `${arr[0]}.${extension}`;
      }
    }
    await updateFileMode(file, target.value, mode);
  }

  async function updateFileMode(file, type, mode) {
    await importEditorMode(mode);

    file.type = type;
    file.cm.setOption("mode", mode);
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
    const file = files[index];
    const extension = target.value.split(".")[1];
    file.name = target.value;

    setState({ ...state });

    if (extension) {
      clearTimeout(fileModeTimeout.current);
      fileModeTimeout.current = setTimeout(async () => {
        for (const key of Object.keys(fileInfo)) {
          const obj = fileInfo[key];

          if (obj.extension === extension) {
            await updateFileMode(file, obj.type, obj.mode);
            return;
          }
        }
        await updateFileMode(file, "default", "default");
      }, 400);
    }
  }

  async function previewMarkdown(file) {
    if (file.renderAsMarkdown) {
      delete file.markdown;
      delete file.renderAsMarkdown;
    }
    else {
      file.formHeight = file.cm.getWrapperElement().clientHeight;
      file.value = file.cm.getValue();
      file.markdown = await markdownToHtml(file.value);
      file.renderAsMarkdown = true;
    }
    setState({ ...state });
  }

  if (state.loading) {
    return <PageSpinner/>;
  }

  if (state.error) {
    return <NoMatch/>;
  }

  return (
    <div className="container form" style={{ "--cm-font-size": `${state.fontSize}px` }}>
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
            {file.type === "markdown" && (
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
          {file.renderAsMarkdown ?
            <Markdown className={state.settings.wrapLines ? "wrap" : ""} file={file}/> :
            <Editor file={file} height={file.formHeight || "332px"} handleLoad={setEditorInstance} settings={state.settings} handleKeypress={handleKeypress}/>
          }
          <div className="from-editor-bottom-bar">
            <span>Size: {file.sizeString}</span>
          </div>
        </div>
      ))}
      {state.loaded && (
        <div>
          {state.submitMessage && (
            <div className="form-footer-message">{state.submitMessage}</div>
          )}
          <div className="form-footer-btns">
            <button className="btn" onClick={addFile} ref={newFileBtnRef}>Add File</button>
            {state.updating ? (
              <button className="btn form-update-btn"
                disabled={state.disabledSubmitButton} onClick={handleSubmit}>
                <span>Update</span>
                {state.disabledSubmitButton && <ButtonSpinner/>}
              </button>
            ) : (
              <SubmitDropdown username={usernameLowerCase}
                disabledSubmitButton={state.disabledSubmitButton}
                handleSubmit={handleSubmit} />
            )}
          </div>
        </div>
      )}
      {state.settingsVisible && <EditorSettings hide={hideSettings} snippetSettings={state.settings} />}
    </div>
  );
}
