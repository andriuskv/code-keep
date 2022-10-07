import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import "./view.scss";
import { GENERIC_ERROR_MESSAGE, SESSION_EXPIRATION_MESSAGE } from "../../messages";
import { setDocumentTitle } from "../../utils";
import { fetchUser, favoriteSnippet } from "../../services/userService";
import { fetchIDBSnippet } from "../../services/snippetIDBService";
import { fetchServerSnippet, createServerSnippet, patchServerSnippet } from "../../services/snippetServerService";
import { deleteSnippet } from "../../services/snippetService";
import { useUser } from "../../context/user-context";
import Icon from "../Icon";
import PageSpinner from "../PageSpinner";
import Notification from "../Notification";
import UserProfileImage from "../UserProfileImage";
import SnippetInfo from "../SnippetInfo";
import FileHeaderDropdown from "./FileHeaderDropdown";
import SnippetDropdown from "../SnippetDropdown";
import SnippetRemoveModal from "../SnippetRemoveModal";
import Editor from "../Editor";
import Markdown from "../Markdown";
import NoMatch from "../NoMatch";
import fileInfo from "../../data/file-info.json";

export default function View() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [state, setState] = useState({
    loading: true
  });
  const [removeModal, setRemoveModal] = useState(null);
  const user = useUser();

  useEffect(() => {
    init();
  }, [user, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  async function init() {
    if (user.loading) {
      return;
    }

    if (user.status === "logged-out") {
      user.resetUser();
      return;
    }

    const { id, username, snippetId } = params;

    if (id) {
      if (id) {
        const snippet = await fetchIDBSnippet(id);

        if (snippet) {
          setDocumentTitle(snippet.title);
          setState({
            snippet,
            user: {
              ...user,
              isLocal: true,
              isLoggedIn: !!user.username
            }
          });
        }
        else {
          setState({});
        }
      }
    }
    else if (username && snippetId) {
      try {
        const snippetUser = await fetchUser(username);

        if (snippetUser.code === 404) {
          setState({});
        }
        else if (snippetUser.code === 500) {
          setState({ message: GENERIC_ERROR_MESSAGE });
        }
        else {
          const snippet = await fetchServerSnippet({
            snippetId,
            username,
            queryParams: location.search
          });

          if (snippet.code === 404) {
            setState({ message: snippet.message });
          }
          else if (snippet.code === 500) {
            setState({ message: GENERIC_ERROR_MESSAGE });
          }
          else {
            snippetUser.isLoggedIn = snippetUser.username.toLowerCase() === user.usernameLowerCase;
            snippet.files = snippet.files.map(file => {
              if (file.type === "markdown") {
                file.renderAsMarkdown = true;
              }
              return file;
            });
            setDocumentTitle(snippet.title);
            setState({
              snippet,
              user: snippetUser
            });
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

  function hideNotification() {
    delete state.notification;
    setState({ ...state });
  }

  async function downloadFiles() {
    const [{ saveAs }, { default: JSZip }] = await Promise.all([
      import("file-saver"),
      import("jszip")
    ]);
    const zip = new JSZip();

    state.snippet.files.forEach(file => {
      const { mimeType } = fileInfo[file.type];

      zip.folder("files").file(file.name, new Blob([file.value], { type: mimeType }));
    });
    const archive = await zip.generateAsync({ type:"blob" });
    saveAs(archive, `${state.snippet.title}.zip`);
  }

  async function uploadSnippet(snippet) {
    const data = await createServerSnippet(snippet, {
      type: "private",
      userId: user._id
    });

    if (data.code === 201) {
      navigate({
        pathname: `/users/${user.usernameLowerCase}`,
        search: "?type=private"
      }, { replace: true });
    }
    else if (data.code === 401) {
      setState({
        ...state,
        notification: { value: SESSION_EXPIRATION_MESSAGE }
      });
    }
    else {
      setState({
        ...state,
        notification: { value: GENERIC_ERROR_MESSAGE }
      });
    }
  }

  function showSnippetRemoveModal(modal) {
    setRemoveModal(modal);
  }

  function hideSnippetRemoveModal() {
    setRemoveModal(null);
  }

  async function removeSnippet() {
    hideSnippetRemoveModal();

    const { id, type, username } = removeModal;
    const deleted = await deleteSnippet({ snippetId: id, type, username });

    if (deleted) {
      navigate(`/users/${username || user.usernameLowerCase}`);
    }
    else {
      state.notification = { value: "Snippet removal was unsuccessful." };
      setState({ ...state });
    }
  }

  async function toggleSnippetPrivacy(snippet) {
    const data = await patchServerSnippet({
      id: snippet.id,
      type: snippet.type === "private" ? "public" : "private"
    });

    if (data.code === 200) {
      snippet.type = data.snippet.type;
    }
    else if (data.code === 401) {
      state.notification = { value: SESSION_EXPIRATION_MESSAGE };
    }
    else {
      state.notification = { value: GENERIC_ERROR_MESSAGE };
    }
    setState({ ...state });
  }

  async function toggleSnippetFavoriteStatus(snippet) {
    const data = await favoriteSnippet(user.usernameLowerCase, {
      snippetUserName: state.user.usernameLowerCase,
      snippet
    });

    if (data.code === 200) {
      state.snippet.type = data.snippet.type;
    }
    else if (data.code === 201) {
      state.snippet.type = "favorite";
    }
    else {
      state.notification = { value: data.message || GENERIC_ERROR_MESSAGE };
    }
    setState({ ...state });
  }

  async function forkSnippet(snippet) {
    const data = await createServerSnippet(snippet, {
      isFork: true,
      userId: user._id
    });

    if (data.code === 201) {
      navigate({
        pathname:`/users/${user.usernameLowerCase}`,
        search: "?type=forked"
      });
      return;
    }
    else if (data.code === 401) {
      setState({
        ...state,
        notification: { value: SESSION_EXPIRATION_MESSAGE }
      });
    }
    else {
      setState({
        ...state,
        notification: { value: GENERIC_ERROR_MESSAGE }
      });
    }
  }

  async function previewMarkdown(file) {
    if (file.renderAsMarkdown) {
      delete file.renderAsMarkdown;
    }
    else {
      file.renderAsMarkdown = true;
    }
    setState({ ...state });
  }

  function handleMarkdownLoad(file, markdown) {
    file.markdown = markdown;
    setState({ ...state });
  }

  if (state.loading) {
    return <PageSpinner/>;
  }
  else if (!state.snippet || state.message) {
    return <NoMatch message={state.message}/>;
  }

  return (
    <div className="container view">
      <div className="view-header">
        {state.user && state.user.username ? (
          <Link to={`/users/${state.user.username}`} className="view-header-user-link">
            <UserProfileImage src={state.user.profileImage.path} size="64px" className="view-header-user-image" />
            <h2 className="view-header-user-username">{state.user.username}</h2>
          </Link>
        ) : null }
        <div className="view-header-bottom">
          <SnippetInfo snippet={state.snippet} snippetUser={state.user} authUser={user}/>
          <button onClick={downloadFiles} className="btn view-download-btn">Download ZIP</button>
          <SnippetDropdown toggleBtnClassName="view-dropdown-toggle-btn"
            snippet={state.snippet} snippetUser={state.user} authUser={user}
            uploadSnippet={uploadSnippet}
            removeSnippet={showSnippetRemoveModal}
            toggleSnippetPrivacy={toggleSnippetPrivacy}
            toggleSnippetFavoriteStatus={toggleSnippetFavoriteStatus}
            forkSnippet={forkSnippet}/>
        </div>
        {state.notification && (
          <Notification margin="top"
            notification={state.notification}
            dismiss={hideNotification}/>
        )}
      </div>
      {state.snippet.files.map(file => (
        <div className="view-editor" key={file.id}>
          <div className="view-editor-header">
            <Icon name="file" />
            <span className="view-editor-header-filename">{file.name}</span>
            <FileHeaderDropdown file={file} previewMarkdown={previewMarkdown} />
          </div>
          {file.renderAsMarkdown ?
            <Markdown file={file} handleLoad={handleMarkdownLoad}/> :
            <Editor file={file} settings={{ wrapLines: false }} readOnly/>
          }
        </div>
      ))}
      {removeModal ? <SnippetRemoveModal
        type={removeModal.type}
        hide={hideSnippetRemoveModal}
        removeSnippet={removeSnippet}/> : null}
    </div>
  );
}
