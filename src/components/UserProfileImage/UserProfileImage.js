import React from "react";
import "./user-profile-image.scss";
import Icon from "../Icon";

export default function UserProfileImage({ src, size = "36px", className }) {
  if (src) {
    return (
      <div className={`user-profile-image-container${className ? ` ${className}` : ""}`}
        style={{ "--size": size }}>
        <img src={src} className="user-profile-image" alt=""/>
      </div>
    );
  }
  return <Icon name="user" className={`user-profile-image-placeholder${className ? ` ${className} placeholder` : ""}`}
    style={{ "--size": size }}/>;
}
