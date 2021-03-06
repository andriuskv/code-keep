function getRandomString() {
  return Math.random().toString(32).slice(2, 10);
}

function setDocumentTitle(title) {
  document.title = `${title} | CodeKeep`;
}

function classNames(...classNames) {
  return classNames.join(" ");
}

function getStringSize(str) {
  const { size } = new Blob([str]);

  return {
    size,
    sizeString: getPrettySize(size)
  };
}

function getPrettySize(bytes) {
  const suffixes = ["B", "kB", "MB"];
  let size = bytes;
  let l = 0;

  while (l < suffixes.length) {
    if (size < 1000) {
      break;
    }
    else {
      size /= 1000;
    }
    l += 1;
  }
  size = l > 0 ? size.toFixed(1) : Math.round(size);
  return `${size} ${suffixes[l]}`;
}


function importEditorMode(mode) {
  if (mode === "default" || mode === "null") {
    return;
  }
  // There is eslint bug with import and template literals
  // return import(`codemirror/mode/${mode}/${mode}.js`);
  // eslint-disable-next-line prefer-template
  return import("codemirror/mode/" + mode + "/" + mode + ".js");
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
  const converter = new Converter({
    extensions: [{
      type: "html",
      regex: `<img src="(.*?)".*\/?>`,
      replace: `<a href="$1" target="_blank">$1</a>`
    }]
  });
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

async function getResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const json = isJson ? await response.json() : {};

  return { code: response.status, ...json };
}

export {
  getRandomString,
  setDocumentTitle,
  classNames,
  getStringSize,
  importEditorMode,
  resetEditorIndentation,
  markdownToHtml,
  renderReadOnlyEditor,
  getResponse
};
