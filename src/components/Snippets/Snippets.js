import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./snippets.scss";
import { setDocumentTitle, getRandomString } from "../../utils";
import { fetchUser } from "../../services/userService";
import { fetchIDBSnippets } from "../../services/snippetIDBService";
import { fetchSnippets, deleteSnippet, sortSnippets } from "../../services/snippetService";
import { fetchServerSnippets, createServerSnippet, updateServerSnippet } from "../../services/snippetServerService";
import { useUser } from "../../context/user-context";
import Icon from "../Icon";
import PageSpinner from "../PageSpinner";
import Editor from "../Editor";
import DateDiff from "../DateDiff";
import NoMatch from "../NoMatch";
import SnippetDropdown from "./SnippetDropdown";
import SnippetRemoveModal from "./SnippetRemoveModal";

export default function Snippets(props) {
  const [state, setState] = useState({
    snippets: [],
    loading: true,
    user: null
  });
  const user = useUser();

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, props.match.url]);

  async function init() {
    const { username } = props.match.params;

    if (user.status === "logged-out") {
      user.updateUserStatus();
      return;
    }

    if (props.match.url === "/snippets") {
      setState({
        snippets: await fetchIDBSnippets(),
        user: { isLocal: true, ...user, isLoggedIn: !!user.username }
      });
      setDocumentTitle("Your Snippets");
    }
    else if (username) {
      if (username.toLowerCase() === user.usernameLowerCase) {
        initAuthUser();
      }
      else if (!user.loading) {
        initUser(username);
      }
    }
  }

  async function initAuthUser() {
    try {
      const data = await fetchSnippets(user._id);
      const newState = {
        snippets: data.snippets,
        user: { ...user, isLoggedIn: true }
      };

      if (data.code === 500) {
        newState.snippetsMessage = "Could not retrieve remote snippets.";
      }
      setState(newState);
      setDocumentTitle(`${user.username} Snippets`);
    } catch (e) {
      console.log(e);
      setState({ message: "Something went wrong. Try again later." });
    }
  }

  async function initUser(username) {
    try {
      const user = await fetchUser(username);

      if (user.code === 404) {
        setState({});
      }
      else if (user.code === 500) {
        setState({ message: "Something went wrong. Try again later." });
      }
      else {
        const data = await fetchServerSnippets(user._id);

        if (data.code === 500) {
          setState({ message: "Something went wrong. Try again later." });
        }
        else {
          setState({ snippets: sortSnippets(data.snippets), user });
          setDocumentTitle(`${user.username} Snippets`);
        }
      }
    } catch (e) {
      console.log(e);
      setState({ message: "Something went wrong. Try again later." });
    }
  }

  function showSnippetRemoveModal(index, isLocal) {
    setState({ ...state, removeModal: {
      index,
      isLocal
    }});
  }

  function hideSnippetRemoveModal() {
    delete state.removeModal;
    setState({ ...state });
  }

  async function removeSnippet() {
    if (state.snippetsMessage) {
      hideSnippetsMessage();
    }
    const { snippets, removeModal } = state;
    const { index, isLocal } = removeModal;
    const { id, userId } = snippets[index];
    const deleted = await deleteSnippet({
      snippetId: id,
      userId,
      isLocal
    });

    if (deleted) {
      snippets.splice(index, 1);
    }
    else {
      state.snippetsMessage = "Snippet removal was unsuccessful.";
    }
    delete state.removeModal;
    setState({ ...state });
  }

  async function toggleSnippetPrivacy(snippet) {
    if (state.snippetsMessage) {
      hideSnippetsMessage();
    }
    const value = !snippet.isPrivate;
    const data = await updateServerSnippet({
      id: snippet.id,
      isPrivate: value
    });

    if (data.code === 200) {
      snippet.isPrivate = value;
    }
    else if (data.code === 401) {
      state.snippetsMessage = "Seems like your session has expired. Relogin and try again.";
    }
    else {
      state.snippetsMessage = "Something went wrong. Try again later.";
    }
    setState({ ...state });
  }

  async function forkSnippet(index) {
    if (state.snippetsMessage) {
      hideSnippetsMessage();
    }
    const snippet = state.snippets[index];
    const id = getRandomString();
    const data = await createServerSnippet({
      ...snippet,
      files: snippet.files.map(file => {
        file.id = getRandomString();
        return file;
      }),
      userId: user._id,
      created: new Date(),
      id,
      fork: {
        id: snippet.id,
        userId: snippet.userId,
        username: state.user.username,
        usernameLowerCase: state.user.usernameLowerCase
      }
    });

    if (data.code === 200) {
      props.history.push({
        pathname:`/users/${user.username}/${data.id ? data.id : id}`
      });
    }
    else if (data.code === 401) {
      state.snippetsMessage = "Seems like your session has expired. Relogin and try again.";
      setState({ ...state });
    }
    else {
      state.snippetsMessage = "Something went wrong. Try again later.";
      setState({ ...state });
    }
  }

  async function uploadSnippet(index) {
    if (state.snippetsMessage) {
      hideSnippetsMessage();
    }
    const snippet = state.snippets[index];
    const remoteSnippet = {
      ...snippet,
      userId: user._id,
      isPrivate: true,
      id: getRandomString(),
      files: snippet.files.map(file => {
        file.id = getRandomString();
        return file;
      })
    };
    delete remoteSnippet.isLocal;
    const data = await createServerSnippet(remoteSnippet);

    if (data.code === 200) {
      const deleted = await deleteSnippet({
        snippetId: snippet.id,
        isLocal : true
      });

      if (deleted) {
        state.snippets.splice(index, 1, remoteSnippet);
      }
      else {
        state.snippets.unshift(remoteSnippet);
        state.snippetsMessage = "Upload was successful, but was unable to remove local snippet.";
      }
    }
    else if (data.code === 401) {
      state.snippetsMessage = "Seems like your session has expired. Relogin and try again.";
    }
    else {
      state.snippetsMessage = "Something went wrong. Try again later.";
    }
    setState({ ...state });
  }

  function hideSnippetsMessage() {
    delete state.snippetsMessage;
    setState({ ...state });
  }

  function renderHeader() {
    const { user } = state;

    if (user.isLocal) {
      return (
        <div className="snippets-header">
          <h2 className="snippets-header-title">Your local snippets</h2>
          <Link to="/snippets/create" className="btn btn-secondary">Create Snippet</Link>
        </div>
      );
    }
    return (
      <div className="snippets-header">
        <h2 className="snippets-header-title">{user.username}'s snippets</h2>
        {user.isLoggedIn && (
          <Link to="/snippets/create" className="btn btn-secondary">Create Snippet</Link>
        )}
      </div>
    );
  }

  function renderSnippets() {
    const { user: snippetUser, snippets } = state;

    if (!snippets.length) {
      return null;
    }
    return (
      <ul>
        {snippets.map((snippet, index) => {
          return (
            <li className="snippet" key={snippet.id}>
              <div className="snippet-top">
                <div className="snippet-title-container">
                  {snippet.isPrivate && <Icon name="locked" className="snippet-title-icon" title="Only you can see this snippet" />}
                  {snippet.isLocal && <Icon name="home" className="snippet-title-icon" title="This snippet is local to your device" />}
                  <h3 className="snippet-title">{snippet.title}</h3>
                </div>
                {snippetUser.isLocal || snippetUser.username === user.username ? (
                  <SnippetDropdown index={index} user={snippetUser} snippet={snippet}
                    uploadSnippet={uploadSnippet}
                    removeSnippet={showSnippetRemoveModal}
                    toggleSnippetPrivacy={toggleSnippetPrivacy} />
                ) : (user.username ? (
                  <button className="btn icon-text-btn snippet-fork-btn" onClick={() => forkSnippet(index)}>
                    <Icon name="fork" />
                    <span>Fork</span>
                  </button>
                ) : null)}
              </div>
              {snippet.description && (
                <p className="snippet-description">{snippet.description}</p>
              )}
              <div className="snippet-info">
                <span className="snippet-info-item">{snippet.files.length} {`File${snippet.files.length > 1 ? "s" : ""}`}</span>
                <span className="snippet-info-item"><DateDiff start={snippet.created} /></span>
                {snippet.fork ? (
                  <span className="snippet-info-item"><Link to={`/users/${snippet.fork.usernameLowerCase}/${snippet.fork.id}`}>Forked from {snippet.fork.username}</Link></span>
                ) : null}
              </div>
              <Link to={snippet.isLocal ? `/snippets/${snippet.id}` : `/users/${snippetUser.usernameLowerCase}/${snippet.id}`} className="snippet-link">
                <Editor file={snippet.files[0]} settings={snippet.settings}
                  height={snippet.files[0].height} readOnly preview />
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  function renderMessage() {
    const { user } = state;

    if (user.isLoggedIn || user.isLocal) {
      return (
        <div className="snippets-message-container">
          <h2>You don't have any snippets yet.</h2>
          <Link to="/snippets/create" className="btn btn-secondary">Create Snippet</Link>
        </div>
      );
    }
    return (
      <div className="snippets-message-container">
        <h2>This user doesn't have any snippets.</h2>
      </div>
    );
  }

  if (state.loading) {
    return <PageSpinner/>;
  }

  if (!state.user || state.message) {
    return <NoMatch message={state.message} />;
  }
  else if (state.snippets.length) {
    return (
      <div className="snippets-container">
        {renderHeader()}
        {state.snippetsMessage && (
          <div className="snippets-message">
            <span>{state.snippetsMessage}</span>
            <button type="button" className="btn icon-btn snippets-message-btn"
              onClick={() => hideSnippetsMessage()}>
              <Icon name="close" />
            </button>
          </div>
        )}
        {renderSnippets()}
        {state.removeModal ? <SnippetRemoveModal hide={hideSnippetRemoveModal} removeSnippet={removeSnippet} /> : null}
      </div>
    );
  }
  else if (state.user.isLocal) {
    return renderMessage();
  }
  return (
    <div className="snippets-container">
      {renderHeader()}
      {renderMessage()}
    </div>
  );
}
