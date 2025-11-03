import { useState, useEffect } from 'react'
import { CButton, CModal, CCard, CCardContent, CCardActions, CCardTitle, CTabButtons } from '@cscfi/csc-ui-react'

const LoginForm = ({ setShowAdminModal, backendUrl, setIsAdmin, setToken, setCurrentProjectId }) => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleAdminLogin = async () => {
        if (!username || !password) return;

        const creds = btoa(`${username}:${password}`);
        const res = await fetch(`${backendUrl}/admin/login`, {
            method: "POST",
            headers: { Authorization: `Basic ${creds}` },
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem("adminToken", data.token);
            setIsAdmin(true);
            setToken(data.token);

            alert("Admin mode activated");
            const project_res = fetch(`${backendUrl}/admin/get_project_id`, {
                method: "GET", headers: { "X-Token": data.token },
            }).then(res => res.json()).then(data => {
                if (data?.project_id) setCurrentProjectId(data.project_id)
            })
        } else {
            alert("Invalid credentials");
        }
    }

    const submit = () => {
        handleAdminLogin();
        setPassword('')
        setUsername('')
        setShowAdminModal(false)
    }

    const cancel = () => {
        setPassword('')
        setUsername('')
        setShowAdminModal(false)
    }
    return (
        <CCard>
            <CCardContent>
                <CCardTitle className="font-bold">Admin</CCardTitle>
                <div className="flex flex-col gap-2 mt-2">
                    <input
                        className="px-3 py-2 border rounded"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        autoFocus
                    />
                    <input
                        type="password"
                        className="px-3 py-2 border rounded"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
            </CCardContent>
            <CCardActions>
                <CButton type="button" onClick={cancel}>Cancel</CButton>
                <CButton type="button" onClick={submit} className="ml-auto">Login</CButton>
            </CCardActions>
        </CCard>
    )
}

const AdminControls = ({ activeDevice, setActiveDevice, backendUrl, currentProjectId, setCurrentProjectId, token, setIsAdmin, setToken, setShowAdminModal }) => {

    const [qxToken, setQxToken] = useState('')
    const [projectId, setProjectId] = useState('')
    const [paused, setPaused] = useState(false)

    const handleSetQxToken = async () => {
        const res = await fetch(`${backendUrl}/set_qx_token`, {
            body: JSON.stringify({ qx_token: qxToken }),
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Token": token },
        });
        if (res.ok) {
            alert(`Qx token set`);
        } else {
            alert("Failed to set Qx token. Is the token valid?");
        }
        setQxToken('')
    }

    const handleSetProjectId = async () => {
        const res = await fetch(`${backendUrl}/set_project_id`, {
            body: JSON.stringify({ project_id: projectId }),
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Token": token },
        });

        if (res.ok) {
            alert(`Project ID set to ${projectId}`);
            setCurrentProjectId(projectId)
        } else {
            alert("Failed to set Project ID");
        }
        setProjectId('')
    }

    const handleSetDevice = async (device) => {
        const res = await fetch(`${backendUrl}/set_device`, {
            body: JSON.stringify({ device }),
            headers: { "Content-Type": "application/json", "X-Token": token },
            method: "POST",
        });

        if (res.ok) {
            const body = await res.json();
            setActiveDevice(body.device);
            if (body.error) {
                alert(`Error setting device: ${body.error}`);
                setActiveDevice(body.device);
            } else {
                alert(`Device set to ${body.device}`);
            }
        } else {
            setActiveDevice(activeDevice)
            alert("Failed to set device");
        }

    }

    const handleTogglePause = async () => {
        const res = await fetch(`${backendUrl}/admin/toggle_pause`, {
            method: "POST",
            headers: { "X-Token": token },
        });

        if (res.ok) {
            const data = await res.json();
            alert(`Pause state changed: ${data.paused ? "Paused" : "Resumed"}`);
            setPaused(data.paused);
        } else {
            alert("Failed to toggle pause state");
        }
    }

    return (
        <CCard key={activeDevice + "card" + currentProjectId}>
            <CCardContent key={activeDevice + "content" + currentProjectId}>
                <CCardTitle className="font-bold">Admin Mode Active</CCardTitle>
                <p className="mt-2">You are currently logged in as an admin.</p>
                <div className="flex flex-row gap-2 mt-2">
                    <input
                        className="px-3 w-full py-2 border rounded"
                        placeholder="Qx token"
                        value={qxToken}
                        onChange={e => setQxToken(e.target.value)}
                        autoFocus
                    />
                    <CButton
                        type="button"
                        onClick={handleSetQxToken}
                        className="ml-auto"
                    >
                        Set Qx Token
                    </CButton>
                </div>

                <div className="flex flex-row gap-2 mt-2">
                    <input
                        key={currentProjectId + "input"}
                        className="px-3 w-full py-2 border rounded"
                        placeholder={currentProjectId != '' ? `${currentProjectId}` : "Project ID"}
                        value={projectId}
                        onChange={e => setProjectId(e.target.value)}
                        autoFocus
                    />
                    <CButton
                        type="button"
                        onClick={handleSetProjectId}
                        className="ml-auto"
                    >
                        Set Project ID
                    </CButton>
                </div>

                <div className="flex flex-row gap-2 mt-2">
                    <CTabButtons
                        value={activeDevice}
                        key={activeDevice}
                        onValueChange={(val) => setActiveDevice(val)}

                    >
                        <CButton
                            value="q50"
                            type="button"
                            onClick={() => handleSetDevice('q50')}
                            className="ml-auto"
                        >
                            Q50
                        </CButton>

                        <CButton
                            value="helmi"
                            type="button"
                            onClick={() => handleSetDevice('helmi')}
                            className="ml-auto"
                        >
                            Helmi
                        </CButton>

                        <CButton
                            value="demo"
                            type="button"
                            onClick={() => handleSetDevice('demo')}
                            className="ml-auto"
                        >
                            Demo
                        </CButton>

                        <CButton
                            value="simulator"
                            type="button"
                            onClick={() => handleSetDevice('simulator')}
                            className="ml-auto"
                        >
                            Simulator
                        </CButton>
                    </CTabButtons>
                </div>
                <div className="flex flex-row justify-start gap-2 mt-2">
                    <CButton
                        key={paused ? "resume" : "pause"}
                        type="button"
                        onClick={handleTogglePause}
                        className="ml-auto"
                    >
                        {paused ? "Resume" : "Pause"}
                    </CButton>
                    <p className='w-full'></p>
                </div>

            </CCardContent>
            <CCardActions>
                <CButton
                    type="button"
                    onClick={() => {
                        localStorage.removeItem("adminToken");
                        setIsAdmin(false);
                        setToken("");
                        setShowAdminModal(false);
                    }}
                >
                    Logout
                </CButton>
            </CCardActions>
        </CCard>
    )
}

export const AdminModal = ({ activeDevice, setActiveDevice, showAdminModal, setShowAdminModal, isAdmin, backendUrl, setIsAdmin, token, setToken }) => {

    const [currentProjectId, setCurrentProjectId] = useState('')

    useEffect(() => {
        if (isAdmin) {
            console.log(token)
            const project_res = fetch(`${backendUrl}/admin/get_project_id`, {
                method: "GET", headers: { "X-Token": token },
            }).then(res => res.json()).then(data => {
                if (data?.project_id) setCurrentProjectId(data.project_id)
            })
        }
    }, []);

    return (
        <CModal value={showAdminModal} dismissable onChangeValue={e => setShowAdminModal(e.detail)}>
            {!isAdmin && (
                <LoginForm 
                    setShowAdminModal={setShowAdminModal}
                    backendUrl={backendUrl}
                    setIsAdmin={setIsAdmin}
                    setToken={setToken}
                    setCurrentProjectId={setCurrentProjectId}
                />
            )}
            {isAdmin && (
                <AdminControls
                    activeDevice={activeDevice}
                    setActiveDevice={setActiveDevice}
                    backendUrl={backendUrl}
                    currentProjectId={currentProjectId}
                    setCurrentProjectId={setCurrentProjectId}
                    token={token}
                    setIsAdmin={setIsAdmin}
                    setToken={setToken}
                    setShowAdminModal={setShowAdminModal}
                />
            )}
        </CModal>
    )
}