function fetchServerSnippets(userId) {
  return fetch(`/snippets/${userId}`).then(getResponse);
}

function fetchServerSnippet({ snippetId, username, status, queryParams }) {
  return fetch(`/snippets/${username}/${snippetId}${status === "edit" ? "/edit" : ""}${queryParams}`).then(getResponse);
}

function createServerSnippet(snippet) {
  return fetch("/snippets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(snippet)
  }).then(getResponse);
}

function updateServerSnippet(snippet) {
  return fetch(`/snippets/${snippet.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(snippet)
  }).then(getResponse);
}

function deleteServerSnippet({ snippetId, type }) {
  return fetch(`/snippets/${snippetId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ type })
  }).then(res => res.status);
}

async function getResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const json = isJson ? await response.json() : {};

  return { code: response.status, ...json };
}
export {
  fetchServerSnippets,
  fetchServerSnippet,
  createServerSnippet,
  updateServerSnippet,
  deleteServerSnippet
};
