import { useEffect, useRef } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "./editor.scss";
import { importEditorMode, resetEditorIndentation, renderReadOnlyEditor } from "../../utils";
import { getSettings } from "../../services/editor-settings";
import fileInfo from "../../data/file-info.json";

export default function Editor({ file, settings, height, readOnly, preview, handleLoad, handleKeypress }) {
  const container = useRef(null);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    const { mode } = fileInfo[file.type];
    await importEditorMode(mode);

    if (readOnly) {
      await import("codemirror/addon/runmode/runmode");

      renderReadOnlyEditor(CodeMirror, container.current, {
        content: file.value,
        mode,
        preview
      });

      if (handleLoad) {
        handleLoad({ container: container.current, file });
      }
      return;
    }
    await import("codemirror/addon/edit/closebrackets");

    const { indentSize, indentWithSpaces, wrapLines } = { ...getSettings(), ...settings };
    const cm = CodeMirror(container.current, {
      value: file.value,
      mode,
      lineNumbers: true,
      showCursorWhenSelecting: true,
      lineWrapping: wrapLines,
      indentUnit: indentSize,
      tabSize: indentSize,
      autoCloseBrackets: true,
      indentWithTabs: !indentWithSpaces,
      scrollbarStyle: preview ? "null" : "native",
      theme: "dracula",
      inputStyle: "textarea",
      extraKeys: {
        Tab: cm => {
          if (cm.somethingSelected()) {
            cm.indentSelection("add");
          }
          else {
            cm.replaceSelection(cm.getOption("indentWithTabs") ? "\t" :
              Array(cm.getOption("indentUnit") + 1).join(" "), "end", "+input");
          }
        }
      }
    });
    resetEditorIndentation(cm);
    handleLoad({ cm, file });
  }

  return <div ref={container} className="cm-container" onKeyPress={handleKeypress ? handleKeypress : null} style={{minHeight: height || "auto"}}></div>;
}
