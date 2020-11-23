import { useState, useEffect } from "react";
import { getSettings, saveSettings } from "../../../services/editor-settings";
import "./editor-settings.scss";

export default function EdittorSettings({ hide, snippetSettings }) {
  const [settings, setSettings] = useState({ ...getSettings(), ...snippetSettings });

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function handleSelectChange({ target }) {
    setSettings({ ...settings, indentSize: parseInt(target.value, 10) });
  }

  function handleFontSizeChange({ target }) {
    let { value } = target;

    if (!target.validity.valid || !value) {
      return;
    }

    if (value < 10) {
      value = 10;
    }
    else if (value > 64) {
      value = 64;
    }
    else {
      value = parseInt(value, 10);
    }
    setSettings({ ...settings, fontSize: value });
  }

  function handleCheckboxToggle({ currentTarget, type, key }) {
    if (type === "keypress" && key !== " " && key !== "Enter") {
      return;
    }
    const name = currentTarget.getAttribute("data-name");

    setSettings({ ...settings, [name]: !settings[name] });
  }

  return (
    <div className="editor-settings-modal-container" onClick={hide}>
      <div className="editor-settings-modal">
        <h3 className="editor-settings-modal-title">Editor Settings</h3>
        <label className="editor-settings-modal-item">
          <div>Editor font size in pixels</div>
          <input type="text" className="input editor-settings-modal-input" inputMode="numeric"
            pattern="\d+"
            defaultValue={settings.fontSize}
            onChange={handleFontSizeChange} />
        </label>
        <label className="editor-settings-modal-item">
          <div>Indentation size</div>
          <select className="select" onChange={handleSelectChange} value={settings.indentSize}>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
        </label>
        <div className="editor-settings-modal-item editor-settings-modal-checkbox"
          role="checkbox" aria-checked={settings.indentWithSpaces} tabIndex="0"
          onClick={handleCheckboxToggle} onKeyPress={handleCheckboxToggle} data-name="indentWithSpaces">
          <div className="editor-settings-modal-checkbox-label">Insert spaces when pressing <b>Tab</b></div>
          <div className={`checkbox${settings.indentWithSpaces ? " checked" : ""}`}>
            <div className="checkmark"></div>
          </div>
        </div>
        <div className="editor-settings-modal-item editor-settings-modal-checkbox"
          role="checkbox" aria-checked={settings.wrapLines} tabIndex="0"
          onClick={handleCheckboxToggle} onKeyPress={handleCheckboxToggle} data-name="wrapLines">
          <div className="editor-settings-modal-checkbox-label">Wrap lines</div>
          <div className={`checkbox${settings.wrapLines ? " checked" : ""}`}>
            <div className="checkmark"></div>
          </div>
        </div>
        <button className="btn text-btn editor-settings-modal-close-btn"
          onClick={event => hide(event, true)}>Close</button>
      </div>
    </div>
  );
}
