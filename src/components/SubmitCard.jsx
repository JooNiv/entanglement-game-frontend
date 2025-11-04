import React, { useState, useEffect } from "react";
import { CButton, CTextField, CSteps, CStep } from '@cscfi/csc-ui-react'

export const SubmitCard = ({ activeDevice, setImage, status, setStatus, 
    setResult, backendUrl, fetchLeaderboard }) => {
    
    const [isValid, setIsValid] = useState(true);
    const [username, setUsername] = useState("");
    const [q1, setQ1] = useState(() => Math.floor(Math.random() * 54));
    const [q2, setQ2] = useState(() => Math.floor(Math.random() * 54));
    const [isDone, setIsDone] = useState(0);
    const [validQubits, setValidQubits] = useState(q1 !== q2);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");


    useEffect(() => {

        if (q1 === q2) {
            let newQ2;
            do {
                newQ2 = Math.floor(Math.random() * 54);
            } while (newQ2 === q1);
            setQ2(newQ2);
        }
    }, []);

    const handleChangeUsernameValue = async (e) => {
        setUsername(e.target.value);
        if (e.target.value.trim() !== "") {
            setIsValid(true);
        }
    }

    const handleSubmit = async (e) => {
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

    const capitalizeFirstLetter = (val) => {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }

    const steps = {
        "queued": 1,
        "transpiling": 2,
        "transpiled": 3,
        "executing": 4,
        "done": 5,
    }

    return (
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
    )
}