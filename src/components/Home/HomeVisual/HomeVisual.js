import React from "react";
import "./home-visual.scss";

export default function HomeVisual() {
  function renderVisual(number) {
    return (
      <div className={`home-visual home-visual-${number}`}>
        <div className="home-visual-user">
          <div className="home-visual-user-image"></div>
          <div className="home-visual-user-name"></div>
        </div>
        <div className="home-visual-tabs">
          <div className="home-visual-tab"></div>
          <div className="home-visual-tab"></div>
          <div className="home-visual-tab"></div>
          <div className="home-visual-tab"></div>
          <div className="home-visual-tab"></div>
          <div className="home-visual-tab"></div>
        </div>
        <div className="home-visual-editor">
          <div>
            <div className="home-visual-editor-title"></div>
            <div className="home-visual-editor-info"></div>
          </div>
          <div className="home-visual-editor-content home-visual-editor-content-1">
            <div className="home-visual-editor-content-line"></div>
            <div className="home-visual-editor-content-line"></div>
            <div className="home-visual-editor-content-line"></div>
            <div className="home-visual-editor-content-line"></div>
          </div>
        </div>
        <div className="home-visual-editor">
          <div>
            <div className="home-visual-editor-title"></div>
            <div className="home-visual-editor-info"></div>
          </div>
          <div className="home-visual-editor-content home-visual-editor-content-2">
            <div className="home-visual-editor-content-line"></div>
            <div className="home-visual-editor-content-line"></div>
            <div className="home-visual-editor-content-line"></div>
          </div>
        </div>
        <div className="home-visual-editor">
          <div>
            <div className="home-visual-editor-title"></div>
            <div className="home-visual-editor-info"></div>
          </div>
          <div className="home-visual-editor-content home-visual-editor-content-3">
            <div className="home-visual-editor-content-line"></div>
            <div className="home-visual-editor-content-line"></div>
            <div className="home-visual-editor-content-line"></div>
            <div className="home-visual-editor-content-line"></div>
            <div className="home-visual-editor-content-line"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-visual-container">
      <div className="home-visual-background"></div>
      {renderVisual(3)}
      {renderVisual(1)}
      {renderVisual(2)}
    </div>
  );
}
