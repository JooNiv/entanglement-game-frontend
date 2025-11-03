import React, { useState, useEffect, useRef } from "react";
import "./App.css"

import { SubmitCard } from "./components/SubmitCard";
import { Score } from "./components/Score";
import { Results } from "./components/Results";
import { Leaderboard } from "./components/Leaderboard";
import { SelectedResult } from "./components/Selectedresult";
import { ScrollToResults } from "./components/ScrollToResults";

function App({ isAdmin, token, activeDevice }) {

  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showQubits, setShowQubits] = useState(false);

  const resultsRef = useRef(null);
  const selectedRef = useRef(null);

  const backendUrl = import.meta.env.VITE_backendUrl || "";

  async function fetchLeaderboard() {
    try {
      const res = await fetch(`${backendUrl}/leaderboard`);
      const data = await res.json();
      const processed = data.map(entry => ({
        ...entry,
        score: (entry.result["00"] || 0) + (entry.result["11"] || 0)
      }));
      processed.sort((a, b) => b.score - a.score);
      setLeaderboard(processed);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-12 p-2 sm:p-6 mb-4 sm:mb-12">
      <div className="flex flex-col gap-6 sm:gap-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-6">
          <SubmitCard
            activeDevice={activeDevice}
            setImage={setImage}
            status={status}
            setStatus={setStatus}
            setResult={setResult}
            backendUrl={backendUrl}
            fetchLeaderboard={fetchLeaderboard}
          />

          <div id="bell-circuit" className="h-min col-span-1 border border-gray-200 p-2 sm:p-4 rounded-lg shadow-lg">
            <p className="text-2xl font-bold">Optimal circuit</p>
            <img src="/bell-circuit.png" alt="Bell Circuit" />
          </div>
        </div>


        {(result) &&
          <Score result={result} resultsRef={resultsRef} />
        }

        <Results result={result} image={image} />

      </div>
      <div className="w-full lg:w-[70%] 2xl:w-[100%] h-min">
        <Leaderboard
          token={token}
          backendUrl={backendUrl}
          isAdmin={isAdmin}
          showQubits={showQubits}
          setShowQubits={setShowQubits}
          fetchLeaderboard={fetchLeaderboard}
          leaderboard={leaderboard}
          setLeaderboard={setLeaderboard}
          selectedIndex={selectedIndex}
          setSelectedResult={setSelectedResult}
          setSelectedIndex={setSelectedIndex}
          setSelectedImage={setSelectedImage}
          selectedRef={selectedRef}
        />
        {/* Selected run bar plot */}
        {(selectedResult) && (
          <SelectedResult
            selectedRef={selectedRef}
            selectedResult={selectedResult}
            setSelectedResult={setSelectedResult}
            setSelectedIndex={setSelectedIndex}
            selectedImage={selectedImage}
            showQubits={showQubits}
          />
        )}
      </div>



      {/* Floating mobile button: bottom-left, only on small screens */}
      {status === "done" && result && (
        <ScrollToResults resultsRef={resultsRef} />
      )}
    </div>
  );
}

export default App;
