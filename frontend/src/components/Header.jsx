import React, { useState, useEffect } from "react";

const STATUS_CONFIG = {
  active: { label: "Active", dotColor: "bg-green-500" },
  degraded: { label: "Degraded", dotColor: "bg-yellow-500" },
  inactive: { label: "Inactive", dotColor: "bg-red-500" },
  checking: { label: "Checking...", dotColor: "bg-slate-400" },
};

const Header = () => {
  const [currentTime, setCurrentTime] = useState(
    new Date().toTimeString().split(" ")[0]
  );
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toTimeString().split(" ")[0]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/health");
        if (response.ok) {
          setStatus("active");
        } else {
          setStatus("degraded");
        }
      } catch (err) {
        setStatus("inactive");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const { label, dotColor } = STATUS_CONFIG[status];

  return (
    <header className="px-10 max-w-[1500px] w-full mx-auto mb-5 pt-5">
      <div>
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="size-12 text-violet-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z"
            />
          </svg>

          <h1 className="text-4xl text-white">
            Cyberthreat Live Dashboard
          </h1>
        </div>
      </div>
      <div className="flex gap-1 justify-between items-center border border-stone-500 rounded-lg p-2 bg-slate-700 mt-5">
        <div className="flex gap-2 items-center text-white">
          <span className={`rounded-full h-3 w-3 ${dotColor}`}></span>
          <span className="font-bold">System Status: </span>
          <span>{label}</span>
        </div>
        <div>
          <span className="font-bold text-3xl text-slate-400" id="clock">
            {currentTime}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;