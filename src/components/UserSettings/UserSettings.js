import React, { useEffect } from "react";
import "./user-settings.scss";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import PageSpinner from "../PageSpinner";
import GithubConnect from "./GithubConnect";
import ProfileImageForm from "./ProfileImageForm";
import UsernameForm from "./UsernameForm";
import PasswordForm from "./PasswordForm";
import AccountDeleteForm from "./AccountDeleteForm";

export default function UserSettings(props) {
  const user = useUser();

  useEffect(() => {
    if (user.status === "logged-out") {
      user.resetUser();
    }
    else if (user.status === "deleted") {
      props.history.replace("/login");
    }
    else if (!user.loading && !user.username) {
      props.history.replace({
        pathname: "/login",
        search: `?redirect=${props.match.url}`
      });
    }
    else {
      setDocumentTitle("Settings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (user.loading) {
    return <PageSpinner/>;
  }
  return (
    <div className="container settings">
      <h2 className="settings-title">Settings</h2>
      <GithubConnect/>
      <ProfileImageForm/>
      <UsernameForm/>
      <PasswordForm/>
      <AccountDeleteForm/>
    </div>
  );
}
