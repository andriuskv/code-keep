import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { GENERIC_ERROR_MESSAGE } from "../../messages";
import { getRandomString, setDocumentTitle, getStringSize, markdownToHtml } from "../../utils";
import { fetchIDBSnippet, saveSnippet } from "../../services/snippetIDBService";
import { fetchServerSnippet, updateServerSnippet, createServerSnippet } from "../../services/snippetServerService";
import { getSettings, saveSettings } from "../../services/editor-settings";
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
import "./form.scss";

export default function Form() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { usernameLowerCase, role: userRole } = useUser();
  const [state, setState] = useState({
    loading: true
  });
  const newFileBtnRef = useRef();
  const fileModeTimeout = useRef();
  const sizeTimeout = useRef();
  const formDirty = useRef(false);
  const updateEditorLanguage = useRef(null);
  const handleEditorStateChange = useRef(null);
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
    handleEditorStateChange.current = handleChange;
  });

  async function init() {
    const { id, username, snippetId } = params;

    if (id) {
      const snippet = await fetchIDBSnippet(id);

      if (snippet) {
        const settings = {...getSettings(), ...snippet.settings };

        setDocumentTitle(`Editing ${snippet.title}`);
        setState({
          ...snippet,
          updating: true,
          settings
        });
        saveSettings(settings);
      }
    }
    else if (username && snippetId) {
      const data = await fetchServerSnippet({
        snippetId,
        username,
        status: "edit",
        queryParams: location.search
      });

      if (data.code === 401) {
        navigate({
          pathname: "/login",
          search: `?redirect=${location.pathname + location.search}`
        }, { replace: true });
      }
      else if (data.code === 404 || data.code === 500) {
        setState({ error: true });
      }
      else {
        const settings = {...getSettings(), ...data.settings };

        setDocumentTitle(`Editing ${data.title}`);
        setState({
          ...data,
          settings,
          updating: true
        });
        saveSettings(settings);
      }
    }
    else {
      setDocumentTitle("Create a new snippet");
      setState({
        title: "",
        description: "",
        files: [getNewFile()],
        settings: {...getSettings() }
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

  function setEditorInstance({ cm, updateLanguage, file }) {
    updateEditorLanguage.current = updateLanguage;
    file.cm = cm;

    setState({ ...state });
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
      const value = file.cm.state.doc.toString().trimEnd();
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
      navigate(pathname);
      return;
    }
    try {
      if (state.updating && snippetType) {
        const gistFilesToRemove = state.gistFilesToRemove || [];
        newSnippet.files = gistFilesToRemove.concat(newSnippet.files);
        newSnippet.username = userRole === "admin" ? params.username : undefined;
      }
      delete state.submitMessage;
      setState({ ...state, disabledSubmitButton: snippetType });
      const callback = state.updating ? updateServerSnippet : createServerSnippet;
      const data = await callback(newSnippet);

      if (data.code === 200 || data.code === 201) {
        navigate(pathname);
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

  function handleFileTypeChange({ target }, index) {
    const file = files[index];
    const { extension } = fileInfo[target.value];

    if (file.name) {
      const arr = file.name.split(".");

      if (arr[1] !== extension) {
        file.name = `${arr[0]}.${extension}`;
      }
    }
    updateFileMode(file, target.value);
  }

  function updateFileMode(file, type) {
    file.type = type;

    updateEditorLanguage.current(file.cm, type);

    setState({ ...state });
  }

  async function hideSettings({ target, currentTarget }, isCloseBtn) {
    if (currentTarget === target || isCloseBtn) {
      setState({ ...state, settingsVisible: false, settings: getSettings() });
    }
  }

  function handleFilenameChange({ target }, index) {
    const file = files[index];
    const extension = target.value.split(".")[1];
    file.name = target.value;

    setState({ ...state });

    if (extension) {
      clearTimeout(fileModeTimeout.current);
      fileModeTimeout.current = setTimeout(() => {
        for (const key of Object.keys(fileInfo)) {
          const obj = fileInfo[key];

          if (obj.extension === extension) {
            updateFileMode(file, obj.type, obj.mode);
            return;
          }
        }
        updateFileMode(file, "default", "default");
      }, 400);
    }
  }

  function handleChange(viewUpdate, index) {
    clearTimeout(sizeTimeout.current);
    sizeTimeout.current = setTimeout(() => {
      const file = files[index];
      const value = viewUpdate.state.doc.toString();

      if (file.value !== value) {
        const { size, sizeString } = getStringSize(value);

        file.size = size;
        file.sizeString = sizeString;

        setState({ ...state });
      }
    }, 400);
  }

  async function previewMarkdown(file) {
    if (file.renderAsMarkdown) {
      delete file.markdown;
      delete file.renderAsMarkdown;
    }
    else {
      file.value = file.cm.state.doc.toString();
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
    <div className="container form">
      <button className="btn icon-text-btn form-settings-btn" onClick={showSettings}>
        <Icon name="settings"/>
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
            <Markdown file={file}/> :
            <Editor file={file} height="332px" handleLoad={setEditorInstance} settings={state.settings} handleKeypress={handleKeypress} handleChange={update => handleEditorStateChange.current(update, index)}/>
          }
          <div className="from-editor-bottom-bar">
            <span>Size: {file.sizeString}</span>
          </div>
        </div>
      ))}
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
      {state.settingsVisible && <EditorSettings hide={hideSettings} snippetSettings={state.settings} />}
    </div>
  );
}
