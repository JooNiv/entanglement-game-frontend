import React, { useState, useEffect } from "react";

import { CButton, CTable, CPagination } from '@cscfi/csc-ui-react'

export const Leaderboard = ({token, backendUrl,isAdmin, showQubits, setShowQubits, fetchLeaderboard, leaderboard, setLeaderboard, selectedIndex, setSelectedResult, setSelectedIndex, setSelectedImage, selectedRef }) => {
    
    const [options, setOptions] = useState({
        itemCount: leaderboard.length,
        itemsPerPage: 5,
        currentPage: 1,
        pageSizes: [5, 10, 15, 20, 40]
    });

    // CPagination calls onChangeValue with the new options object.
    const onPageChange = (newOptions) => {
        setOptions(prev => ({ ...prev, ...newOptions }));


    };

    // Keep pagination itemCount in sync with number of leaderboard entries
    useEffect(() => {
        setOptions(prev => ({ ...prev, itemCount: leaderboard.length }));
    }, [leaderboard]);

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


    return (
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
    )
}