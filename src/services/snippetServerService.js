function fetchServerSnippets(userId) {
  return fetch(`/snippets/${userId}`).then(res => res.json());
}

function fetchServerSnippet(snippetId, userId, status) {
  return fetch(`/snippets/${snippetId}${status === "edit" ? "/edit" : ""}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id: userId })
  }).then(res => res.json());
}

function createServerSnippet(snippet) {
  return fetch("/snippets/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(snippet)
  }).then(res => res.json());
}

function deleteServerSnippet(snippetId) {
  return fetch("/snippets/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id: snippetId })
  }).then(res => res.json());
}


export {
  fetchServerSnippets,
  fetchServerSnippet,
  createServerSnippet,
  deleteServerSnippet
};
