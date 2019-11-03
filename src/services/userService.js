function postUser(data, endPoint) {
  return fetch(`/users${endPoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(res => res.json());
}

async function fetchUser(username) {
  return fetch(`/users/${username}`).then(res => res.json());
}

function createUser(data) {
  return postUser(data, "/register");
}

function loginUser(data) {
  return postUser(data, "/login");
}

function logoutUser() {
  return fetch("/users/logout").then(res => res.json());
}

function updateUserPassword(data) {
  return postUser(data, "/change/password");
}

function updateUser(data) {
  return postUser(data, "/update");
}

export {
  fetchUser,
  createUser,
  loginUser,
  logoutUser,
  updateUserPassword,
  updateUser
};
