import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./snippets.scss";
import { setDocumentTitle } from "../../utils";
import { fetchUser } from "../../services/userService";
import { fetchIDBSnippets } from "../../services/snippetIDBService";
import { fetchSnippets, deleteSnippet } from "../../services/snippetService";
import { fetchServerSnippets } from "../../services/snippetServerService";
import { useUser } from "../../context/user-context";
import Icon from "../Icon";
import Editor from "../Editor";
import DateDiff from "../DateDiff";
import NoMatch from "../NoMatch";
import spinner from "../../assets/ring.svg";

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
      return;
    }

    if (props.match.url === "/snippets") {
      setState({
        snippets: await fetchIDBSnippets(),
        user: { isLocal: true }
      });
      setDocumentTitle("Your Snippets");
    }
    else if (username) {
      if (username === user.username) {
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
          setState({ snippets: data.snippets, user });
          setDocumentTitle(`${user.username} Snippets`);
        }
      }
    } catch (e) {
      console.log(e);
      setState({ message: "Something went wrong. Try again later." });
    }
  }

  function editSnippet(id, isLocal) {
    const path = isLocal ? `/snippets/${id}/edit` : `/users/${state.user.username}/${id}/edit`;

    props.history.push({
      pathname: path
    });
  }

  async function removeSnippet(index, isLocal) {
    const { snippets } = state;
    const deleted = await deleteSnippet(snippets[index].id, isLocal);

    if (deleted) {
      snippets.splice(index, 1);
      setState({ ...state, snippets: [...snippets] });
    }
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
          <h2 className="snippets-header-title">Your Local Snippets</h2>
          <Link to="/snippets/create" className="btn btn-secondary">Create Snippet</Link>
        </div>
      );
    }
    return (
      <div className="snippets-header">
        <h2 className="snippets-header-title">{user.username}</h2>
        {user.isLoggedIn && (
          <Link to="/snippets/create" className="btn btn-secondary">Create Snippet</Link>
        )}
      </div>
    );
  }

  function renderSnippets() {
    const { user, snippets } = state;

    if (!snippets.length) {
      return null;
    }
    return (
      <ul>
        {snippets.map((snippet, index) => {
          return (
            <li className="snippet" key={snippet.id}>
              <div className="snippet-title-container">
                {snippet.isLocal && <Icon name="home" className="snippet-title-icon" title="This snippet is local to your device." />}
                <h3 className="snippet-title">{snippet.title}</h3>
              </div>
              {snippet.description && (
                <p className="snippet-description">{snippet.description}</p>
              )}
              <div className="snippet-info">
                <span className="snippet-info-item">{snippet.files.length} {`File${snippet.files.length > 1 ? "s" : ""}`}</span>
                <span><DateDiff start={snippet.created} /></span>
              </div>
              <Link to={snippet.isLocal ? `/snippets/${snippet.id}` : `/users/${user.username}/${snippet.id}`} className="snippet-link">
                <Editor file={snippet.files[0]} settings={snippet.settings}
                  height={snippet.files[0].height} readOnly preview />
              </Link>
              {user.isLocal || user.isLoggedIn ? (
                <div className="snippet-footer">
                  <button className="btn icon-text-btn" onClick={() => editSnippet(snippet.id, snippet.isLocal)}>
                    <Icon name="edit" />
                    <span>Edit</span>
                  </button>
                  <button className="btn icon-text-btn danger-btn snippet-remove-btn" onClick={() => removeSnippet(index, snippet.isLocal)}>
                    <Icon name="trash" />
                    <span>Remove</span>
                  </button>
                </div>
              ) : null}
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
    return <img src={spinner} className="snippets-spinner" alt="" />;
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
