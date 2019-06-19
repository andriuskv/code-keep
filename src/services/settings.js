let settings = JSON.parse(localStorage.getItem("ce-settings")) || {
  indentSize: 2,
  indentWithSpaces: true,
  fontSize: 16,
  wrapLines: true
};

function getSettings() {
  return settings;
}

function getSetting(settingName) {
  return settings[settingName];
}

function saveSettings(newSettings) {
  settings = { ...settings, ...newSettings };
  localStorage.setItem("ce-settings", JSON.stringify(settings));
}

export {
  getSettings,
  getSetting,
  saveSettings
};
