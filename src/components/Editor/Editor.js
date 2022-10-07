import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { keymap, lineNumbers } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { indentRange, indentUnit } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { getSettings } from "../../services/editor-settings";

export default function Editor({ file, settings, height, readOnly, preview, handleLoad, handleKeypress, handleChange }) {
  const view = useRef(null);
  const container = useRef(null);
  const compartments = useRef({});

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!readOnly && view.current) {
      view.current.dispatch({
        effects: [
          compartments.current.tabSize.reconfigure(EditorState.tabSize.of(settings.indentSize)),
          compartments.current.indentUnit.reconfigure(indentUnit.of(settings.indentWithSpaces ? " ".repeat(settings.indentSize) : "\t")),
          compartments.current.lineWrapping.reconfigure(settings.wrapLines ? EditorView.lineWrapping : [])
        ]
      });

      const length = view.current.state.doc.length;

      if (length > 1) {
        view.current.dispatch({
          changes: indentRange(view.current.state, 0, length)
        });
      }
    }
  }, [settings]);

  async function init() {
    const language = await fetchLanguage(file.type);
    const { indentSize, indentWithSpaces, wrapLines } = { ...getSettings(), ...settings };
    const theme = EditorView.theme({
      "&": {
        backgroundColor: "transparent"
      },
      "&.cm-editor.cm-focused": {
        "outline": "none"
      },
      ".cm-content": {
        "padding-right": "var(--space-sm)"
      },
      ".cm-content.focus-visible": {
        "box-shadow": "none"
      },
      ".cm-gutters": {
        cursor: "default",
        "user-select": "none",
        backgroundColor: "var( --editor-background-color, var(--color-grey-dark))"
      },
      ".cm-lineNumbers .cm-gutterElement": {
        padding: "0 var(--space-sm)",
        "min-width": readOnly ? "40px" : "32px",
        textAlign: readOnly ? "center" : "right",
        color: "var(--color-grey-lighter)"
      },
      ".cm-scroller": {
        overflow: "inherit"
      }
    }, { dark: true });

    compartments.current.language = new Compartment();
    compartments.current.indentUnit = new Compartment();
    compartments.current.tabSize = new Compartment();
    compartments.current.lineWrapping = new Compartment();

    const readOnlyExtensions = [
      lineNumbers(),
      EditorState.readOnly.of(true),
      EditorView.editable.of(false)
    ];

    const defaultExtensions = [
      basicSetup,
      keymap.of([indentWithTab])
    ];

    const editorState = EditorState.create({
      doc: file.value,
      extensions: [
        ...(readOnly ? readOnlyExtensions : defaultExtensions),
        theme,
        dracula,
        handleChange ? EditorView.updateListener.of(handleChange) : [],
        compartments.current.language.of(language),
        compartments.current.tabSize.of(EditorState.tabSize.of(indentSize)),
        compartments.current.indentUnit.of(indentUnit.of(indentWithSpaces ? " ".repeat(indentSize) : "\t")),
        !preview && wrapLines ? compartments.current.lineWrapping.of(EditorView.lineWrapping) : []
      ]
    });

    view.current = new EditorView({
      state: editorState,
      parent: container.current
    });

    if (handleLoad) {
      handleLoad({ cm: view.current, updateLanguage, file });
    }
  }

  function fetchLanguage(type) {
    try {
      for (const lang of languages) {
        if (lang.alias.includes(type)) {
          return lang.load();
        }
      }
      return [];
    } catch (e) {
      console.log(e);
      return [];
    }
  }

  async function updateLanguage(view, type) {
    const language = await fetchLanguage(type);

    view.dispatch({
      effects: [
        compartments.current.language.reconfigure(language)
      ]
    });
  }

  return <div ref={container} className="cm-container" onKeyPress={handleKeypress ? handleKeypress : null} style={{minHeight: height || "auto", fontSize: settings.fontSize || "16px" }}></div>;
}
