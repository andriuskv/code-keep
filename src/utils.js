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
  return import(`codemirror/mode/${mode}/${mode}.js`);
}

function resetEditorIndentation(cm) {
  cm.setSelection({ line: 0, ch: 0 }, { line: cm.lastLine() + 1 }, { scroll: false });

  if (cm.getValue()) {
    cm.indentSelection("smart");
  }
  cm.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 0 }, { scroll: false });
}

async function markdownToHtml(markdown) {
  const [{ Converter }] = await Promise.all([
    import("showdown"),
    import("github-markdown-css")
  ]);
  const converter = new Converter();
  converter.setFlavor("github");
  return converter.makeHtml(markdown);
}

export {
  getRandomString,
  setDocumentTitle,
  importEditorMode,
  resetEditorIndentation,
  markdownToHtml
};
