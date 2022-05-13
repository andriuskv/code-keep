import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./user-settings.scss";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import PageSpinner from "../PageSpinner";
import GithubConnect from "./GithubConnect";
import ProfileImageForm from "./ProfileImageForm";
import UsernameForm from "./UsernameForm";
import PasswordForm from "./PasswordForm";
import AccountDeleteForm from "./AccountDeleteForm";

export default function UserSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();

  useEffect(() => {
    if (user.status === "logged-out") {
      user.resetUser();
    }
    else if (user.status === "deleted") {
      navigate("/login", { replace: true });
    }
    else if (!user.loading && !user.username) {
      navigate({
        pathname: "/login",
        search: `?redirect=${location.pathname}`
      }, { replace: true });
    }
    else {
      setDocumentTitle("Settings");
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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
