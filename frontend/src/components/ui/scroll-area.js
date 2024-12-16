import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

export function ScrollArea({ children, className, orientation = "vertical" }) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden",
        orientation === "horizontal" ? "overflow-x-auto" : "overflow-y-auto",
        className
      )}
    >
      <div className="h-full w-full">{children}</div>
    </div>
  );
}

ScrollArea.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  orientation: PropTypes.oneOf(["vertical", "horizontal"]),
};
