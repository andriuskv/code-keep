import { Link, useParams } from "react-router-dom";
import "./snippet-info.scss";
import DateDiff from "./DateDiff";
import Icon from "../Icon";

export default function SnippetInfo({ snippet, snippetUser, authUser }) {
  const { username } = useParams();

  function getIcon(type) {
    const icons = {
      private: {
        id: "locked",
        title: "Only you can see this snippet"
      },
      local: {
        id: "home",
        title: "This snippet is local to your device"
      },
      gist: {
        id: "github",
        title: "This snippet is hosted on GitHub"
      }
    };

    if (username) {
      icons.favorite = {
        id: "star",
        title: snippetUser.usernameLowerCase === authUser.usernameLowerCase ?
          "One of your favorite snippets" :
          `${snippetUser.username} favorite snippet`
      };
    }
    const icon = icons[type];

    if (!icon) {
      return null;
    }
    return <Icon name={icon.id} className="snippet-info-title-icon"title={icon.title}/>;
  }
  return (
    <div className="snippet-info">
      <div className="snippet-info-title-container">
        {getIcon(snippet.type)}
        <h3 className="snippet-info-title">{snippet.title}</h3>
      </div>
      {snippet.description && (
        <p className="snippet-info-description">{snippet.description}</p>
      )}
      <div className="snippet-info-details">
        <span className="snippet-info-details-item">{snippet.files.length} {`File${snippet.files.length > 1 ? "s" : ""}`}</span>

        <span className="snippet-info-details-item"><DateDiff snippet={snippet}/></span>
        {snippet.fork ? (
          <span className="snippet-info-details-item"><Link
            to={`/users/${snippet.fork.usernameLowerCase}/${snippet.fork.id}`}
            className="snippets-info-link">Forked from {snippet.fork.username}</Link></span>
        ) : snippet.type === "gist" ? (
          <span className="snippet-info-details-item">
            <a href={snippet.url} className="snippets-info-link">GitHub</a>
          </span>
        ) : null}
      </div>
    </div>
  );
}
