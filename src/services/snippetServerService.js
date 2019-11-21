function fetchServerSnippets(userId) {
  return fetch(`/snippets/${userId}`).then(res => res.json());
}

function fetchServerSnippet({ snippetId, userId, status, queryParams }) {
  return fetch(`/snippets/${snippetId}${status === "edit" ? "/edit" : ""}${queryParams}`, {
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

function updateServerSnippet(snippet) {
  return fetch("/snippets/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(snippet)
  }).then(res => res.json());
}

function deleteServerSnippet(data) {
  return fetch("/snippets/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(res => res.json());
}


export {
  fetchServerSnippets,
  fetchServerSnippet,
  createServerSnippet,
  updateServerSnippet,
  deleteServerSnippet
};
