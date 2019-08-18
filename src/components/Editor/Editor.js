import React, { useEffect } from "react";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/edit/closebrackets";
import "codemirror/theme/dracula.css";
import "./editor.scss";
import { importEditorMode, resetEditorIndentation } from "../../utils";
import { getSettings } from "../../services/settings";

export default function Editor({ file, settings, height, readOnly, preview, handleLoad }) {
  const { id, mode, value } = file;

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    const { indentSize, indentWithSpaces, wrapLines } = { ...getSettings(), ...settings };
    await importEditorMode(mode);

    const cm = CodeMirror(document.getElementById(`cm-${id}`), {
      value,
      mode,
      readOnly,
      // Negative value hides cursor
      cursorBlinkRate: readOnly ? -1 : CodeMirror.defaults.cursorBlinkRate,
      lineNumbers: true,
      showCursorWhenSelecting: true,
      lineWrapping: readOnly ? false : wrapLines,
      indentUnit: indentSize,
      tabSize: indentSize,
      autoCloseBrackets: true,
      indentWithTabs: !indentWithSpaces,
      viewportMargin: readOnly ? CodeMirror.defaults.viewportMargin : Infinity,
      scrollbarStyle: preview ? "null" : "native",
      theme: "dracula",
      disableInput: readOnly,
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

    if (readOnly) {
      cm.getInputField().setAttribute("tabindex", "-1");
    }

    if (handleLoad) {
      handleLoad({
        cm,
        file,
        height: cm.getWrapperElement().offsetHeight
      });
    }
  }

  return <div id={`cm-${id}`} className="cm-container" style={{height: height || "auto"}}></div>;
}
