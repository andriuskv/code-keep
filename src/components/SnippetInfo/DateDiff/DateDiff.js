import { useState, useEffect } from "react";

export default function DateDiff({ start }) {
  const [dateDiff, setDateDiff] = useState(getDateDiff());
  let id = 0;

  useEffect(() => {
    clearTimeout(id);
    setDateDiff(getDateDiff());
    update();

    return () => {
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  function update() {
    id = setTimeout(() => {
      setDateDiff(getDateDiff());
      update();
    }, 30000);
  }

  function getDateDiff() {
    return Date.now() - start;
  }

  function renderDateDiffString(elapsed) {
    const second = 1000;
    const minute = second * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365.25;

    if (elapsed < minute) {
      return "Created just now";
    }
    else if (elapsed < hour) {
      return getDateDiffString("minute", elapsed, minute);
    }
    else if (elapsed < day) {
      return getDateDiffString("hour", elapsed, hour);
    }
    else if (elapsed < month) {
      return getDateDiffString("day", elapsed, day);
    }
    else if (elapsed < year) {
      return getDateDiffString("month", elapsed, month);
    }
    return getDateDiffString("year", elapsed, year);
  }

  function getDateDiffString(unitName, elapsed, unitValue) {
    const value = Math.round(elapsed / unitValue);
    return `Created ${value} ${unitName}${value > 1 ? "s" : ""} ago`;
  }

  return renderDateDiffString(dateDiff);
}
