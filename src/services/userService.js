async function fetchUser(username) {
  return fetch(`/users/${username}`).then(getResponse);
}

function createUser(data) {
  return fetch("/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

function loginUser(data) {
  return fetch("/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

function logoutUser() {
  return fetch("/users/logout").then(res => res.status);
}

function updateUser(username, data) {
  return fetch(`/users/${username}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

function deleteUser(username) {
  return fetch(`/users/${username}`, {
    method: "DELETE"
  }).then(res => res.status);
}

function uploadProfileImage(username, data) {
  return fetch(`/users/${username}/image`, {
    method: "POST",
    body: data
  }).then(getResponse);
}

function favoriteSnippet(username, { snippet, snippetUserName }) {
  return fetch(`/users/${username}/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      snippetId: snippet.id,
      username: snippetUserName,
      userId: snippet.userId,
      type: snippet.type
    })
  }).then(getResponse);
}

async function getResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const json = isJson ? await response.json() : {};

  return { code: response.status, ...json };
}

export {
  fetchUser,
  createUser,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,
  uploadProfileImage,
  favoriteSnippet
};
