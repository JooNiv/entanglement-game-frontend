import React, { useState, useEffect, useRef, use } from "react";
import { BarChart } from '@mui/x-charts/BarChart';
import { CButton, CTable, CTextField, CSteps, CStep, CProgressBar, CPagination } from '@cscfi/csc-ui-react'
import "./App.css"

function App({ isAdmin, token, activeDevice }) {
  const [username, setUsername] = useState("");
  const [q1, setQ1] = useState(() => Math.floor(Math.random() * 54));
  const [q2, setQ2] = useState(() => Math.floor(Math.random() * 54));
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("");
  const [isDone, setIsDone] = useState(0);
  const [result, setResult] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isValid, setIsValid] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [showQubits, setShowQubits] = useState(false);
  const [validQubits, setValidQubits] = useState(q1 !== q2);
  const [error, setError] = useState("");
  const [options, setOptions] = useState({
    itemCount: leaderboard.length,
    itemsPerPage: 5,
    currentPage: 1,
    pageSizes: [5, 10, 15, 20, 40]
  });
  const resultsRef = useRef(null);
  const selectedRef = useRef(null);
  const steps = {
    "queued": 1,
    "transpiling": 2,
    "transpiled": 3,
    "executing": 4,
    "done": 5,
  }

  const backendUrl = import.meta.env.VITE_backendUrl || "";

  useEffect(() => {

    if (q1 === q2) {
      let newQ2;
      do {
        newQ2 = Math.floor(Math.random() * 54);
      } while (newQ2 === q1);
      setQ2(newQ2);
    }
  }, []);

  useEffect(() => {
    async function fetchShowQubits() {
      try {
        const res = await fetch(`${backendUrl}/show_qubits`);
        const data = await res.json();
        setShowQubits(data);
      } catch (err) {
        console.error("Failed to fetch showQubits:", err);
      }
    }

    fetchShowQubits();
  }, []);

  function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  }

  const handleSetShowQubits = async () => {
    try {
      const res = await fetch(`${backendUrl}/show_qubits`, {
        method: "POST",
        headers: { "X-Token": token },
      });
      const data = await res.json();
      //console.log("Toggled showQubits to:", data);
      setShowQubits(data);
    } catch (err) {
      //console.error("Failed to toggle showQubits:", err);
    }
  };

  // CPagination calls onChangeValue with the new options object.
  const onPageChange = (newOptions) => {
    setOptions(prev => ({ ...prev, ...newOptions }));


  };

  // Keep pagination itemCount in sync with number of leaderboard entries
  useEffect(() => {
    setOptions(prev => ({ ...prev, itemCount: leaderboard.length }));
  }, [leaderboard]);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    var validInput = true;

    if (q1 === q2) {
      setValidQubits(false);
      //console.log("Qubits must be different");
      validInput = false;
    }

    if (username.trim() === "") {
      setIsValid(false);
      validInput = false;
    }

    if (!validInput) return;


    if (status !== "" && status !== "done") return; // prevent multiple submissions

    setStatus("queued");
    setSubmitted(true);
    setIsValid(true);
    setResult(null);
    setImage(null);
    setIsDone(0);
    setValidQubits(true);

    try {
      // Send the job request
      const res = await fetch(`${backendUrl}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, q1: Number(q1), q2: Number(q2) }),
      });

      // parse response body (if any)
      let data = null;
      try { data = await res.json(); } catch (err) { /* ignore JSON parse errors */ }

      // Only start websocket on successful response
      if (!res.ok) {
        const errMsg = data?.detail || `Submission failed (${res.status})`;
        setError(errMsg);
        setStatus("");
        setSubmitted(false);
        return;
      }

      const { task_id } = data || {};
      if (!task_id) {
        setStatus("Invalid response from server");
        setSubmitted(false);
        return;
      }

      // Connect WebSocket for updates
      let wsUrl;
      if (backendUrl) {
        try {
          const u = new URL(backendUrl);
          const proto = u.protocol === "https:" ? "wss:" : "ws:";
          const base = u.pathname.replace(/\/$/, ""); // preserve any base path
          wsUrl = `${proto}//${u.host}${base}/ws/${task_id}`;
        } catch (err) {
          // fallback if backendUrl is not a full URL
          const cleaned = backendUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
          const proto = backendUrl.startsWith("https") ? "wss:" : "ws:";
          wsUrl = `${proto}//${cleaned}/ws/${task_id}`;
        }
      } else {
        // same-origin fallback
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${proto}//${window.location.host}/ws/${task_id}`;
      }
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        //console.log(msg?.status)
        if (msg.status === "done") {
          const entries = Object.entries(msg.result).sort(([a], [b]) => a.localeCompare(b));
          const map = new Map(entries);
          setResult(map);
          setStatus("done");
          setIsDone(1)
          ws.close();
          fetchLeaderboard(); // refresh leaderboard after job done
        }
        else if (msg.status === "transpiled") {
          if (msg.image) {
            setImage(msg.image);
          }
          setStatus("transpiled");
        }
        else {
          setStatus(prev => (prev === "done" ? prev : msg.status));
        }
      };


    } catch (err) {
      console.error(err);
      setStatus("");
      setSubmitted(false);
    }
  }

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

  async function handleChangeUsernameValue(e) {
    setUsername(e.target.value);
    if (e.target.value.trim() !== "") {
      setIsValid(true);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-12 p-2 sm:p-6 mb-4 sm:mb-12">
      <div className="flex flex-col gap-6 sm:gap-6 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-6">
          <div id="input" className="col-span-1 border border-gray-200 p-2 sm:p-4 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold">Choose Your Qubits</h2>
            <form onSubmit={handleSubmit} className="mt-4">
              <label>
                Username:
                <CTextField
                  value={username}
                  valid={isValid}
                  placeholder="Enter your username"
                  validation="Username is required"
                  onChangeValue={handleChangeUsernameValue}
                  required
                  style={{ marginLeft: 8 }}
                />
              </label>
              <div className="flex space-x-4">
                <label className="w-full">
                  Control Qubit:
                  <CTextField
                    type="number"
                    value={q1}
                    valid={validQubits}
                    validation="Qubits must be different"
                    onChangeValue={(e) => setQ1(Number(e.target.value))}
                    min="1"
                    max="54"
                    style={{ marginLeft: 8, width: 50 }}
                  />
                </label>
                <label className="w-full">
                  Target Qubit:
                  <CTextField
                    type="number"
                    value={q2}
                    valid={validQubits}
                    validation=""
                    onChangeValue={(e) => setQ2(Number(e.target.value))}
                    min="1"
                    max="54"
                    style={{ marginLeft: 8, width: 50 }}
                  />
                </label>
              </div>
              <CButton
                type="button"
                className='flex items-center py-2'
                onClick={(e) => handleSubmit(e)}
                loading={status !== "" && status !== "done"}
              >
                Execute On {capitalizeFirstLetter(activeDevice)}
              </CButton>
              {error && (
                <p className="text-red-600 mt-2">{error}</p>
              )}
              {submitted && (<>
                <CSteps className="mt-6 font-semibold" v-model="step" value={steps[status]}>
                  <CStep>Queued</CStep>

                  <CStep>Transpiling</CStep>

                  <CStep>Transpiled</CStep>

                  <CStep>Executing</CStep>

                  <CStep>Done</CStep>

                </CSteps>
              </>
              )}

            </form>
          </div>

          <div id="bell-circuit" className="h-min col-span-1 border border-gray-200 p-2 sm:p-4 rounded-lg shadow-lg">
            <p className="text-2xl font-bold">Optimal circuit</p>
            <img src="/bell-circuit.png" alt="Bell Circuit" />
          </div>
        </div>


        {(result) &&
          <div id="score" ref={resultsRef} className="flex flex-col gap-4 border border-gray-200 p-2 sm:p-4 rounded-lg shadow-lg">
            <div className="">
              <h4 className="text-2xl font-bold">Score:</h4>
            </div>
            <div>

              <div>
                {(() => {
                  const display = result;
                  const val00 = display.get("00") || 0;
                  const val11 = display.get("11") || 0;
                  return (
                    <>
                      <p className="ml-1">{val00 + val11}/1000</p>
                      <CProgressBar hideDetails value={(val00 + val11) / 10} />
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        }

        <div id="results" className="grid grid-cols-1 sm:grid-cols-1 gap-6">
          {result && (
            <div className="col-span-1 border border-gray-200 p-4 rounded-lg shadow-lg">
              <h4 className="text-2xl font-bold">Result Distribution:</h4>
              <BarChart
                barLabel="value"
                xAxis={[
                  {
                    id: 'barCategories',
                    data: Array.from(result.keys()),
                  },
                ]}
                series={[
                  {
                    data: Array.from(result.values()),
                    label: "Count",
                    valueFormatter: (value) => value, // optional, for tooltip
                    showDataLabels: true, // <-- show value labels on bars
                    dataLabelFormatter: (value) => value, // <-- label is the value
                  },
                ]}
                height={300}
              />
            </div>
          )}
          {image && (
            <div className="col-span-1 h-min border border-gray-200 p-4 rounded-lg shadow-lg">
              <h4 className="text-2xl font-bold">Executed circuit:</h4>
              <img src={image} alt="Circuit Diagram" />
            </div>
          )}
        </div>
      </div>
      <div className="w-full lg:w-[70%] 2xl:w-[100%] h-min">
        <div id="leaderboard" className="h-min border border-gray-200 p-2 sm:p-4 rounded-lg shadow-lg">
          <div className="flex flex-row flex-wrap sm:flex-row items-start sm:items-center justify-between">
            <h2 className="text-2xl pb-2 sm:pl-0 sm:pb-0 font-bold">Leaderboard</h2>
            <div className="flex gap-4">
              {isAdmin && (<CButton onClick={handleSetShowQubits} className="ml-0 sm:ml-2 mb-2">Show Qubits</CButton>)}
              <CButton onClick={fetchLeaderboard} className="ml-0 sm:ml-2 mb-2">Refresh</CButton>
            </div>
          </div>
          {leaderboard.length === 0 ? (
            <p>No entries yet</p>
          ) : (
            <div className="flex flex-col justify-start items-start sm:items-end w-full">
              <CPagination
                value={options}
                //hideDetails
                onChangeValue={onPageChange}
                control
                className="hidden sm:flex"
              />
              <CPagination
                value={{ ...options }}
                hideDetails
                onChangeValue={onPageChange}
                control
                className="flex sm:hidden"
              />
              <CTable responsive mobileBreakpoint={400} className="w-full">
                <table border="1" cellPadding="5">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      {showQubits && (<th>Qubits</th>)}
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.slice((options.currentPage - 1) * options.itemsPerPage, (options.currentPage - 1) * options.itemsPerPage + options.itemsPerPage).map((entry, i) => {
                      const globalIndex = (options.currentPage - 1) * options.itemsPerPage + i;
                      const isSelected = selectedIndex === globalIndex;
                      return (
                        <tr
                          key={globalIndex}
                          onClick={() => {
                            // Build a Map in the same shape as `result` (Map of keys to counts)
                            const entries = Object.entries(entry.result).sort(([a], [b]) => a.localeCompare(b));
                            const map = new Map(entries);
                            setSelectedResult(map);
                            setSelectedIndex(globalIndex);
                            setSelectedImage(entry.image);
                            // scroll to results
                            selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className={isSelected ? 'bg-blue-100 cursor-pointer' : 'cursor-pointer'}
                        >
                          <td>{globalIndex + 1}</td>
                          <td>{entry.username}</td>
                          {showQubits && (
                            <td>
                              ({entry.q1}, {entry.q2})
                            </td>
                          )}
                          <td>{entry.score}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CTable>
              <div className="w-full flex justify-between">
                <CButton className=" mt-2 sm:mt-4" onClick={() => {
                  const el = document.getElementById('leaderboard');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>Scroll up</CButton>

                {isAdmin && (
                  <CButton danger className=" mt-2 sm:mt-4" onClick={async () => {
                    try {
                      const ok = window.confirm("Are you sure you want to reset the leaderboard? This action cannot be undone.");
                      if (!ok) return;
                      const res = await fetch(`${backendUrl}/reset`, { method: "DELETE", headers: { "X-Token": token } });
                      const data = await res.json();
                      if (data?.leaderboard) {
                        setLeaderboard(data.leaderboard);
                      }
                    } catch (err) {
                      console.error("Failed to reset leaderboard:", err);
                    }
                  }} >RESET</CButton>
                )}
              </div>

            </div>
          )}
        </div>
        {/* Selected run bar plot */}
        {(selectedResult) && (
          <div ref={selectedRef} className="w-full mt-4 border border-gray-200 p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Selected Run - Result Distribution</h3>
              <div>
                <CButton onClick={() => { setSelectedResult(null); setSelectedIndex(null); }} className="ml-2">Clear</CButton>
              </div>
            </div>
            <div className="mt-4">
              <BarChart
                barLabel="value"
                xAxis={[{ id: 'selBarCats', data: Array.from(selectedResult.keys()) }]}
                series={[{ data: Array.from(selectedResult.values()), label: 'Count', valueFormatter: v => v, showDataLabels: true, dataLabelFormatter: v => v }]}
                height={260}
              //colors={['#006778ff']}
              />
            </div>
            {(selectedImage && showQubits) && (
              <div className="mt-4">
                <h4 className="text-xl font-semibold">Selected Run - Executed circuit:</h4>
                <img src={selectedImage} alt="Circuit Diagram" />
              </div>
            )}
          </div>
        )}
      </div>



      {/* Floating mobile button: bottom-left, only on small screens */}
      {status === "done" && result && (
        <CButton
          onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="fixed bottom-4 left-6 z-50 sm:hidden text-white shadow-lg"
          aria-label="Scroll to results"
        >
          <p className="">Results</p>
        </CButton>
      )}
    </div>
  );
}

export default App;
