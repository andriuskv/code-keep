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
  markdownToHtml,
  getResponse
};
