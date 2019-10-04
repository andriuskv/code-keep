import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./view.scss";
import { setDocumentTitle, markdownToHtml } from "../../utils";
import { fetchUser } from "../../services/userService";
import { fetchIDBSnippet } from "../../services/snippetIDBService";
import { fetchServerSnippet } from "../../services/snippetServerService";
import { useUser } from "../../context/user-context";
import Icon from "../Icon";
import Dropdown from "./Dropdown";
import Editor from "../Editor";
import DateDiff from "../DateDiff";
import Markdown from "../Markdown";
import NoMatch from "../NoMatch";
import spinner from "../../assets/ring.svg";

export default function View(props) {
  const [state, setState] = useState({
    loading: true,
    isLocal: props.match.path === "/snippets/:id"
  });
  const user = useUser();

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function init() {
    if (props.match.path === "/snippets/:id") {
      const { id } = props.match.params;

      if (id) {
        const snippet = await fetchIDBSnippet(id);

        if (snippet) {
          snippet.username = user.username;
          setDocumentTitle(snippet.title);
          setState(snippet);
        }
        else {
          setState({});
        }
      }
    }
    else if (props.match.path === "/users/:username/:snippetId") {
      try {
        const { username, snippetId } = props.match.params;
        const user = await fetchUser(username);

        if (user.code === 404) {
          setState({});
        }
        else if (user.code === 500) {
          setState({ message: "Something went wrong. Try again later." });
        }
        else {
          const snippet = await fetchServerSnippet(snippetId, user._id);

          if (snippet.code === 404) {
            setState({});
          }
          if (snippet.code === 500) {
            setState({ message: "Something went wrong. Try again later." });
          }
          else {
            snippet.username = user.username;
            setDocumentTitle(snippet.title);
            setState(snippet);
          }
        }
      } catch (e) {
        console.log(e);
        setState({ message: "Something went wrong. Try again later." });
      }
    }
  }

  async function downloadFiles() {
    const [{ saveAs }, { default: JSZip }] = await Promise.all([
      import("file-saver"),
      import("jszip")
    ]);
    const zip = new JSZip();

    state.files.forEach(file => {
      zip.folder("files").file(file.name, new Blob([file.value], { type: file.mimeType }));
    });
    const archive = await zip.generateAsync({ type:"blob" });
    saveAs(archive, `${state.title}.zip`);
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
    setState({ ...state });
  }

  if (state.loading) {
    return state.isLocal ? null : <img src={spinner} className="view-spinner" alt="" />;
  }
  else if (!state.title || state.message) {
    return <NoMatch message={state.message} />;
  }
  return (
    <div className="view">
      <div className="view-header">
        <div>
          {state.username ? <Link to={`/users/${state.username}`}>
            <h2 className="view-header-user-username">{state.username}</h2>
          </Link> : null }
          <div className="view-title-container">
            {state.isLocal && <Icon name="home" className="view-title-icon" title="This snippet is local to your device." />}
            <h3 className="view-title">{state.title}</h3>
          </div>
          {state.description && (
            <p className="view-description">{state.description}</p>
          )}
          <div className="view-date"><DateDiff start={state.created} /></div>
        </div>
        <button onClick={downloadFiles} className="btn view-header-btn">Download ZIP</button>
      </div>
      {state.files.map(file => (
        <div className="view-editor" key={file.id}>
          <div className="view-editor-header">
            <Icon name="file" />
            <span className="view-editor-header-filename">{file.name}</span>
            <Dropdown file={file} previewMarkdown={previewMarkdown} />
          </div>
          {file.renderAsMarkdown ? <Markdown content={file.markdown} /> :
            <Editor file={file} settings={state.settings}
              height={file.height} readOnly />
          }
        </div>
      ))}
    </div>
  );
}
