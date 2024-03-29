import { useState } from "react";
import "./profile-image-form.scss";
import { GENERIC_ERROR_MESSAGE } from "../../../messages";
import { useUser } from "../../../context/user-context";
import { uploadProfileImage } from "../../../services/userService";
import Icon from "../../Icon";
import ButtonSpinner from "../../ButtonSpinner";
import Notification from "../../Notification";
import UserProfileImage from "../../UserProfileImage";

export default function ProfileImageForm() {
  const user = useUser();
  const [image, setImage] = useState(null);
  const [submitButtonState, setSubmitButtonState] = useState(false);
  const [notification, setNotification] = useState(null);

  async function handleFormSubmit(event) {
    const formData = new FormData();

    event.preventDefault();
    formData.append("profile_image", image.blob, image.name);
    setSubmitButtonState(true);

    try {
      const data = await uploadProfileImage(user.username, formData);

      if (data.username) {
        user.updateUser({
          profileImage: data.profileImage
        });
        setNotification({
          value: "Profile image has been changed successfully.",
          type: "positive"
        });
      }
      else if (data.code >= 400) {
        setNotification({ value: data.message || GENERIC_ERROR_MESSAGE });
      }
      setSubmitButtonState(false);
    } catch (e) {
      console.log(e);
      setNotification({ value: GENERIC_ERROR_MESSAGE });
      setSubmitButtonState(false);
    }
  }

  function showFileSelection({ key }) {
    if (key === "Enter" || key === " ") {
      document.getElementById("profile-image-file-input").click();
    }
  }

  async function resizeImage(file) {
    const image = new Image();

    image.onload = async function() {
      const size = 64;
      let width = image.width;
      let height = image.height;

      if (width > height) {
        if (width > size) {
          height = height * (size / width);
          width = size;

          if (height < size) {
            width = width * (size / height);
            height = size;
          }
        }
      }
      else if (height > size) {
        width = width * (size / height);
        height = size;

        if (width < size) {
          height = height * (size / width);
          width = size;
        }
      }

      URL.revokeObjectURL(image.src);
      image.onload = null;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(image, 0, 0, width, height);

      canvas.toBlob(blob => {
        setImage({
          name: file.name,
          blob
        });
      }, file.type);
    };
    image.src = URL.createObjectURL(file);
  }

  function handleFileUpload({ target }) {
    const [file] = target.files;

    if (file.type.startsWith("image")) {
      if (file.size > 32768) {
        resizeImage(file);
      }
      else {
        setImage({
          name: file.name,
          blob: file
        });
      }

      if (notification) {
        setNotification(null);
      }
    }
    else {
      setNotification({ value: "Selected file is not an image." });
    }
    target.value = "";
  }

  function renderImagePreview() {
    let imageSrc = null;

    if (image) {
      imageSrc = URL.createObjectURL(image.blob);
    }
    else if (user.profileImage) {
      imageSrc = user.profileImage.path;
    }
    return <UserProfileImage src={imageSrc}/>;
  }

  return (
    <div className="settings-item">
      <h3 className="settings-item-title">Change Profile Image</h3>
      {notification && (
        <Notification margin="bottom"
          notification={notification}
          dismiss={() => setNotification(null)}/>
      )}
      <form className="profile-image-form" onSubmit={handleFormSubmit}>
        {renderImagePreview()}
        <label className="btn profile-image-select-btn" tabIndex="0"
          onKeyDown={showFileSelection}>
          <span>Select an image</span>
          <input type="file" id="profile-image-file-input" accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileUpload} />
        </label>
        <button className="btn icon-text-btn profile-image-form-submit-btn"
          disabled={submitButtonState || !image}>
          <Icon name="upload"/>
          <span>Upload</span>
          {submitButtonState && <ButtonSpinner/>}
        </button>
      </form>
    </div>
  );
}
