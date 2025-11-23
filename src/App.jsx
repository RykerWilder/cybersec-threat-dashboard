import './App.css';
import { useState, useEffect } from 'react';

function App() {

  return (
    <div className="bg-slate-800">
      <header className="p-10 max-w-1300">
        <div>
          <div className="flex items-center gap-1">
            <svg className="shield-icon max-w-12 text-blue-300" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z">
              </path>
            </svg>
            <h1 className="text-4xl text-white">Cybersecurity Threat Dashboard</h1>
          </div>
        </div>
        <div className="flex gap-1 justify-between items-center border border-stone-500 rounded-lg p-2 bg-slate-700 mt-5">
          <div className="flex gap-2 items-center">
            <span className="rounded-full h-3 w-3 bg-green-500"></span>
            <span className="font-bold">System Status: </span>
            <span>Active</span>
          </div>
          <div>
            <span className="font-bold text-3xl">
            </span>
          </div>
        </div>
      </header>
      <main className="p-10 columns-1 md:columns-2 gap-5 space-y-5">
        <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
          <canvas className="h-64"></canvas>
        </div>
        <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
          <canvas className="h-80"></canvas>
        </div>
        <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
          <canvas className="h-72"></canvas>
        </div>
        <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
          <canvas className="h-96"></canvas>
        </div>
      </main>
    </div>
  );
}

export default App;