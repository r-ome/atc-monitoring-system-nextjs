"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/app/lib/utils";

export const AppTimer = () => {
  const [currentTime, setCurrentTime] = useState(
    formatDate(new Date(), "HH:mm:ss a")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatDate(new Date(), "hh:mm:ss a"));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-end">
      <div className="hidden md:flex">
        {formatDate(new Date(), "eeee, MMMM dd, yyyy").toLocaleString()}
      </div>
      <div className="flex justify-end">{currentTime}</div>
    </div>
  );
};
