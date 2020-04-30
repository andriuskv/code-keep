import { getResponse } from "../utils";

async function fetchUser(username) {
  return fetch(`/api/users/${username}`).then(getResponse);
}

function createUser(data) {
  return fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

function loginUser(data) {
  return fetch("/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

function logoutUser() {
  return fetch("/api/users/logout").then(res => res.status);
}

function updateUser(username, data) {
  return fetch(`/api/users/${username}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

function deleteUser(username) {
  return fetch(`/api/users/${username}`, {
    method: "DELETE"
  }).then(res => res.status);
}

function uploadProfileImage(username, data) {
  return fetch(`/api/users/${username}/image`, {
    method: "POST",
    body: data
  }).then(getResponse);
}

function favoriteSnippet(username, { snippet, snippetUserName }) {
  return fetch(`/api/users/${username}/favorites`, {
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
