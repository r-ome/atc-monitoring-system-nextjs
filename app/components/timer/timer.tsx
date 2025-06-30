"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

export const AppTimer = () => {
  const [currentTime, setCurrentTime] = useState(
    format(new Date(), "HH:mm:ss a")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(format(new Date(), "hh:mm:ss a"));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-end">
      <div>{format(new Date(), "eeee, MMMM dd, yyyy").toLocaleString()}</div>
      <div className="flex justify-end">{currentTime}</div>
    </div>
  );
};
