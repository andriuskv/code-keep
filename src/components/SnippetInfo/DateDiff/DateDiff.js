import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function DateDiff({ snippet }) {
  const location = useLocation();
  const [dateDiff, setDateDiff] = useState(() => getDateDiff());
  let id = 0;

  useEffect(() => {
    update();

    return () => {
      clearTimeout(id);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function update() {
    id = setTimeout(() => {
      setDateDiff(getDateDiff());
      update();
    }, 30000);
  }

  function getDateDiff() {
    const date = location.pathname === "/snippets/recent" ? snippet.createdAt : snippet.modifiedAt || snippet.createdAt;
    return Date.now() - date;
  }

  function renderDateDiffString(elapsed) {
    const verb = location.pathname === "/snippets/recent" ?
      "Created" :
      snippet.modifiedAt > snippet.createdAt ? "Modified" : "Created";
    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365.25;

    if (elapsed < minute) {
      return `${verb} just now`;
    }
    const getDateDiffString = getDateDiffStringFunc(elapsed, verb);

    if (elapsed < hour) {
      return getDateDiffString("minute", minute);
    }
    else if (elapsed < day) {
      return getDateDiffString("hour", hour);
    }
    else if (elapsed < month) {
      return getDateDiffString("day", day);
    }
    else if (elapsed < year) {
      return getDateDiffString("month", month);
    }
    return getDateDiffString("year", year);
  }

  function getDateDiffStringFunc(elapsed, verb) {
    return (unitName, unitValue) => {
      const value = Math.round(elapsed / unitValue);
      return `${verb} ${value} ${unitName}${value > 1 ? "s" : ""} ago`;
    };
  }

  return renderDateDiffString(dateDiff);
}
