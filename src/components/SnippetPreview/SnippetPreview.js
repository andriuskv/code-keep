import { Link } from "react-router-dom";
import SnippetInfo from "../SnippetInfo";
import SnippetUserLink from "../SnippetUserLink";
import Markdown from "../Markdown";
import Editor from "../Editor";
import "./snippet-preview.scss";

export default function SnippetPreview({ snippet, snippetUser, authUser, to, children }) {
  const [file] = snippet.files;

  // Preview first 0 lines
  file.value = file.value.split("\n").slice(0, 10).join("\n");

  return (
    <li className="snippet-preview">
      {snippet.user && <SnippetUserLink user={snippet.user} size="24px"/>}
      <div className="snippet-preview-top">
        <SnippetInfo snippet={snippet} snippetUser={snippetUser} authUser={authUser}/>
        {children}
      </div>
      <Link to={to} className="snippet-preview-link">
        {file.type === "markdown" ?
          <Markdown file={file}/> :
          <Editor file={file} settings={{ wrapLines: false }} readOnly preview/>
        }
      </Link>
    </li>
  );
}
