import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./view.scss";
import { GENERIC_ERROR_MESSAGE } from "../../messages";
import { setDocumentTitle, markdownToHtml } from "../../utils";
import { fetchUser } from "../../services/userService";
import { fetchIDBSnippet } from "../../services/snippetIDBService";
import { fetchServerSnippet } from "../../services/snippetServerService";
import { useUser } from "../../context/user-context";
import Icon from "../Icon";
import PageSpinner from "../PageSpinner";
import UserProfileImage from "../UserProfileImage";
import SnippetInfo from "../SnippetInfo";
import FileHeaderDropdown from "./FileHeaderDropdown";
import Editor from "../Editor";
import Markdown from "../Markdown";
import NoMatch from "../NoMatch";
import fileInfo from "../../data/file-info.json";

export default function View(props) {
  const [state, setState] = useState({
    loading: true
  });
  const user = useUser();

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, props.match.url]);

  async function init() {
    if (user.loading) {
      return;
    }

    if (user.status === "logged-out") {
      user.resetUser();
      return;
    }

    if (props.match.path === "/snippets/:id") {
      const { id } = props.match.params;

      if (id) {
        const snippet = await fetchIDBSnippet(id);

        if (snippet) {
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
          setState({ message: GENERIC_ERROR_MESSAGE });
        }
        else {
          const snippet = await fetchServerSnippet({
            snippetId,
            username,
            queryParams: props.location.search
          });

          if (snippet.code === 404) {
            setState({});
          }
          if (snippet.code === 500) {
            setState({ message: GENERIC_ERROR_MESSAGE });
          }
          else {
            snippet.user = user;
            setDocumentTitle(snippet.title);
            setState(snippet);
          }
        }
      } catch (e) {
        console.log(e);
        setState({ message: GENERIC_ERROR_MESSAGE });
      }
    }
    else {
      setState({});
    }
  }

  async function downloadFiles() {
    const [{ saveAs }, { default: JSZip }] = await Promise.all([
      import("file-saver"),
      import("jszip")
    ]);
    const zip = new JSZip();

    state.files.forEach(file => {
      const { mimeType } = fileInfo[file.type];

      zip.folder("files").file(file.name, new Blob([file.value], { type: mimeType }));
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
    return <PageSpinner/>;
  }
  else if (!state.title || state.message) {
    return <NoMatch message={state.message} />;
  }
  return (
    <div className="view">
      <div className="view-header">
        {state.user ? (
          <Link to={`/users/${state.user.username}`} className="view-header-user-link">
            <UserProfileImage src={state.user.profileImage.path} size="64px" className="view-header-user-image" />
            <h2 className="view-header-user-username">{state.user.username}</h2>
          </Link>
        ) : null }
        <div className="view-header-bottom">
          <SnippetInfo snippet={state}/>
          <button onClick={downloadFiles} className="btn view-download-btn">Download ZIP</button>
        </div>
      </div>
      {state.files.map(file => (
        <div className="view-editor" key={file.id}>
          <div className="view-editor-header">
            <Icon name="file" />
            <span className="view-editor-header-filename">{file.name}</span>
            <FileHeaderDropdown file={file} previewMarkdown={previewMarkdown} />
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
