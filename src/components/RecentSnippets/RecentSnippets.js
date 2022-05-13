import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
    const data = await createServerSnippet(snippet, {
      isFork: true,
      userId: user._id
    });

    if (data.code === 201) {
      navigate({
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
    const data = await favoriteSnippet(user.usernameLowerCase, {
      snippetUserName: snippet.user.usernameLowerCase,
      snippet
    });

    if (data.code === 201 || data.code === 204) {
      navigate({
        pathname: `/users/${user.usernameLowerCase}`,
        search: "?type=favorite"
      });
      return;
    }
    setState({
      ...state,
      notification: {
        value: data.message || GENERIC_ERROR_MESSAGE
      }});
  }

  function hideNotification() {
    delete state.notification;
    setState({ ...state });
  }

  function renderSnippets() {
    if (!state.snippets) {
      return null;
    }
    else if (state.snippets.length === 0) {
      return "No recent snippets";
    }
    return (
      <ul className="recent-snippet-items">
        {state.snippets.map(snippet => (
          <SnippetPreview key={snippet.id} snippet={snippet} to={`/users/${snippet.user.usernameLowerCase}/${snippet.id}`}>
            {!user.username || user._id === snippet.user._id ? null : (
              <SnippetDropdown snippet={snippet} snippetUser={snippet.user} authUser={user}
                toggleSnippetFavoriteStatus={toggleSnippetFavoriteStatus}
                forkSnippet={forkSnippet}/>
            )}
          </SnippetPreview>
        ))}
      </ul>
    );
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
        <Notification margin="bottom"
          notification={state.notification}
          dismiss={hideNotification}/>
      )}
      {renderSnippets()}
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
