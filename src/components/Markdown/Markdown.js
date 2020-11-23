import { useEffect, useState } from "react";
import { Markup } from "interweave";
import "./markdown.scss";
import { markdownToHtml } from "../../utils";

export default function Markdown({ className, file, handleLoad }) {
  const [state, setState] = useState(file.markdown);

  useEffect(() => {
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function init() {
    if (state) {
      return;
    }
    const markdown = await markdownToHtml(file.value);

    setState(markdown);

    if (handleLoad) {
      handleLoad(file, markdown);
    }
  }
  return <div className={`markdown-body${className ? ` ${className}` : ""}`}><Markup content={state}/></div>;
}
