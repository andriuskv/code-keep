import React from "react";
import { Link } from "react-router-dom";
import "./snippet-user-link.scss";
import UserProfileImage from "../UserProfileImage";

export default function SnippetUserLink({ user, size }) {
  return (
    <Link to={`/users/${user.usernameLowerCase}`} className="snippet-user-link">
      <UserProfileImage src={user.profileImage.path} size={size}/>
      <div className="snippet-user-username">{user.username}</div>
    </Link>
  );
}
