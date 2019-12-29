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

function renderReadOnlyEditor(CodeMirror, element, { content, mode, preview }) {
  const div = document.createElement("div");
  let gutter = "";
  let line = 1;

  CodeMirror.runMode(content, mode, (string, style) => {
    if (preview && line > 10) {
      return;
    }

    if (string === "\n") {
      div.appendChild(document.createTextNode("\n"));
      gutter += `<div class="CodeMirror-linenumber">${line}</div>`;
      line += 1;
    }
    else if (style) {
      const span = document.createElement("span");
      span.appendChild(document.createTextNode(string));
      span.className = `cm-${style}`;
      div.appendChild(span);
    }
    else {
      div.appendChild(document.createTextNode(string));
    }
  });

  if (!preview || line < 10) {
    gutter += `<div class="CodeMirror-linenumber">${line}</div>`;
  }
  element.innerHTML = `
    <div class="CodeMirror cm-s-dracula" style="--gutter-width: ${line >= 1000 ? "60px" : "40px"}">
      <div class="editor-content-container"></div>
      <div class="editor-gutter">${gutter}</div>
    </div>
  `;
  div.className = "editor-content CodeMirror-lines";
  element.querySelector(".editor-content-container").insertAdjacentElement("afterbegin", div);
}

export {
  getRandomString,
  setDocumentTitle,
  importEditorMode,
  resetEditorIndentation,
  markdownToHtml,
  renderReadOnlyEditor
};
