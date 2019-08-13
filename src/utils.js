function getRandomString() {
  return Math.random().toString(32).slice(2, 10);
}

function setDocumentTitle(title) {
  document.title = `${title} | CodeKeep`;
}

function importEditorMode(mode) {
  if (mode === "default" || mode === "null") {
    return;
  }
  else if (mode === "text/x-scss") {
    mode = "css";
  }
  else if (mode === "text/x-sh") {
    mode = "shell";
  }
  else if (/text\/x-(java|kotlin|scala|csrc|c\+\+src|csharp|objectivec)/.test(mode)) {
    mode = "clike";
  }
  return import(`codemirror/mode/${mode}/${mode}.js`);
}

function resetEditorIndentation(cm) {
  cm.setSelection({ line: 0, ch: 0 }, { line: cm.lastLine() + 1 }, { scroll: false });

  if (cm.getValue()) {
    cm.indentSelection("smart");
  }
  cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 0 }, { scroll: false });
}

export {
  getRandomString,
  setDocumentTitle,
  importEditorMode,
  resetEditorIndentation
};
