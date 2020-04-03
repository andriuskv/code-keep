import React, { useState, useEffect } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "./recent-snippets.scss";
import { GENERIC_ERROR_MESSAGE, SESSION_EXPIRATION_MESSAGE } from "../../messages";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import { favoriteSnippet } from "../../services/userService";
import { fetchServerRecentSnippets, createServerSnippet } from "../../services/snippetServerService";
import Notification from "../Notification";
import NoMatch from "../NoMatch";
import SnippetDropdown from "../SnippetDropdown";
import SnippetPreview from "../SnippetPreview";

export default function RecentSnippets() {
  const location = useLocation();
  const history = useHistory();
  const user = useUser();
  const [state, setState] = useState(null);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname + location.search]);

  async function init() {
    const page = new URLSearchParams(location.search).get("page") || 1;

    try {
      const data = await fetchServerRecentSnippets(page);

      if (data.snippets) {
        setDocumentTitle("Most Recent Snippets");
        setState({ ...data, page: parseInt(page, 10) });
        window.scrollTo(0, 0);
      }
      else if (data.code === 404) {
        setState({ pageNotification: "This page doesn't exists." });
      }
      else {
        setState({ pageNotification: GENERIC_ERROR_MESSAGE });
      }
    } catch (e) {
      console.log(e);
      setState({ pageNotification: GENERIC_ERROR_MESSAGE });
    }
  }

  async function forkSnippet(snippet) {
    if (state.notification) {
      hideNotification();
    }
    const data = await createServerSnippet({
      ...snippet,
      files: snippet.files.map(file => ({
        id: uuidv4(),
        name: file.name,
        type: file.type,
        value: file.value
      })),
      userId: user._id,
      created: new Date(),
      id: uuidv4(),
      type: "forked",
      fork: {
        id: snippet.id,
        userId: snippet.userId
      }
    });

    if (data.code === 201) {
      history.push({
        pathname: `/users/${user.usernameLowerCase}`,
        search: "?type=forked"
      });
      return;
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
    if (state.notification) {
      hideNotification();
    }
    const data = await favoriteSnippet(user.usernameLowerCase, {
      snippetId: snippet.id,
      username: snippet.user.usernameLowerCase,
      userId: snippet.userId,
      type: snippet.type
    });

    if (data.code === 201 || data.code === 204) {
      history.push({
        pathname: `/users/${user.usernameLowerCase}`,
        search: "?type=favorite"
      });
      return;
    }
    else {
      state.notification = { value: data.message || GENERIC_ERROR_MESSAGE };
    }
    setState({ ...state });
  }

  function hideNotification() {
    delete state.notification;
    setState({ ...state });
  }

  if (!state) {
    return null;
  }
  else if (state.pageNotification) {
    return <NoMatch message={state.pageNotification} />;
  }

  return (
    <div className="container recent-snippets">
      <h2 className="recent-snippets-header-title">Most Recent Snippets</h2>
      {state.notification && (
        <Notification className="recent-snippets-notification"
          value={state.notification}
          dismiss={hideNotification}/>
      )}
      <ul className="recent-snippet-items">
        {state.snippets && state.snippets.map(snippet => (
          <SnippetPreview key={snippet.id} snippet={snippet} to={`/users/${snippet.user.usernameLowerCase}/${snippet.id}`}>
            {!user.username || user._id === snippet.user._id ? null : (
              <SnippetDropdown snippet={snippet} snippetUser={snippet.user} authUser={user}
                toggleSnippetFavoriteStatus={toggleSnippetFavoriteStatus}
                forkSnippet={forkSnippet}/>
            )}
          </SnippetPreview>
        ))}
      </ul>
      <div className="recent-snippets-footer">
        {state.page > 1 ? (
          <Link to={`/snippets/recent?page=${state.page - 1}`} className="btn">Newer</Link>
        ) : <button className="btn" disabled>Newer</button>}
        {state.hasMore ? (
          <Link to={`/snippets/recent?page=${state.page + 1}`} className="btn">Older</Link>
        ) : <button className="btn" disabled>Older</button>}
      </div>
    </div>
  );
}
