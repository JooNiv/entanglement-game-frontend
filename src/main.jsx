import { StrictMode, useState, useEffect, use } from 'react'
import { createRoot } from 'react-dom/client'
import { CButton, CModal, CCard, CCardContent, CCardActions, CCardTitle, CTabButtons } from '@cscfi/csc-ui-react'
import { QRCodeSVG } from 'qrcode.react'
import App from './App.jsx'

// metadata
document.title = 'Quantum Entanglement Game'

export const useWindowSize = () => {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);

    window.addEventListener('resize', onResize);
    // In case the window was resized before the listener attached
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return { width };
}

function MainApp() {
  const [showQRModal, setShowQRModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "")
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeDevice, setActiveDevice] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [qxToken, setQxToken] = useState('')
  const [projectId, setProjectId] = useState('')
  const [paused, setPaused] = useState(false)

  const currentUrl = window.location.href
  const backendUrl = import.meta.env.VITE_backendUrl || "";

  const { width } = useWindowSize();
  let size;

  if (width >= 2600) size = 'large';
  else if (width >= 768) size = 'medium';
  else size = 'small';

  const modalWidths = { small: '90vw', medium: '1400px', large: '50vw' }

  useEffect(() => {

    const device_res = fetch(`${backendUrl}/get_device`, {
      method: "GET",
    }).then(res => res.json()).then(data => {
      if (data?.device) setActiveDevice(data.device)
    })

    if (!token) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/check_token`, {
          method: "POST",
          headers: { "X-Token": token },
        });

        if (!res.ok) {
          localStorage.removeItem("adminToken");

          if (!cancelled) setToken("");
        }
      } catch (err) {
        // On network/error treat token as invalid
        localStorage.removeItem("adminToken");
        console.error("Error validating token:", err);
        if (!cancelled) setToken("");
      }
      if (!cancelled) setIsAdmin(true);
      else setIsAdmin(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleSetQxToken = async () => {
    const res = await fetch(`${backendUrl}/set_qx_token`, {
      body: JSON.stringify({ qx_token: qxToken }),
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Token": token },
    });
    if (res.ok) {
      alert(`Qx token set`);
    } else {
      alert("Failed to set Qx token");
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
    } else {
      alert("Failed to set Project ID");
    }
    setProjectId('')
  }

  const handleSetDevice = async (device) => {
    const res = await fetch(`${backendUrl}/set_device`, {
      body: JSON.stringify({ device }),
      headers: { "Content-Type": "application/json" , "X-Token": token},
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
    const res = await fetch(`${backendUrl}/toggle_pause`, {
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

  async function handleAdminLogin() {
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
    } else {
      alert("Invalid credentials");
    }
  }

  return (
    <div>
      <div className='pl-2 pt-6 gap-2 sm:gap-0 sm:pt-0 sm:pl-0 flex flex-col sm:flex-row border-b-4 border-[#006778ff] items-start sm:items-center'>

        <h1 className="pl-2 sm:m-6 w-fit sm:w-full text-3xl sm:text-4xl font-bold">Entanglement Game</h1>
        <div className='flex flex-row flex-wrap w-full justify-start sm:justify-end items-center'>
          <CButton
            type="button"
            className='flex items-center m-2 sm:mx-6'
            onClick={() => setShowAdminModal(true)}
          >
            Admin Login
          </CButton>
          <CButton
            type="button"
            className='flex items-center m-2 sm:mr-6'
            onClick={() => setShowQRModal(true)}
          >
            QR Code
          </CButton>
          <CButton
            type="button"
            className='flex items-center m-2 sm:mr-6'
            onClick={() => window.open('https://fiqci.fi/status', '_blank')}
          >
            Calibration Data
          </CButton>
        </div>
      </div>
      <App isAdmin={isAdmin} token={token} activeDevice={activeDevice} />

      <CModal value={showAdminModal} dismissable onChangeValue={e => setShowAdminModal(e.detail)}>
        {!isAdmin && (
          <CCard>
            <CCardContent>
              <CCardTitle className="font-bold">Admin Login</CCardTitle>
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
        )}
        {isAdmin && (
          <CCard key={activeDevice+ "card"}>
            <CCardContent key={activeDevice+ "content"}>
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
                  className="px-3 w-full py-2 border rounded"
                  placeholder="Project ID"
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
        )}
      </CModal>

      <CModal
        value={showQRModal}
        width={modalWidths[size]}
        dismissable
        onChangeValue={e => setShowQRModal(e.detail)}

      >
        <CCard>
          <CCardContent>
            <CCardTitle className='font-bold'>QR Code</CCardTitle>
            <div className="flex justify-center mb-4">
              <QRCodeSVG
                className="min-h-[50vh] w-auto"
                value={currentUrl}
              />
            </div>
            <p className="text-sm text-gray-600 text-center break-all">
              {currentUrl}
            </p>
          </CCardContent>
          <CCardActions>
            <CButton
              type="button"
              onClick={() => setShowQRModal(false)}
              className="ml-auto"
            >
              Close
            </CButton>
          </CCardActions>
        </CCard>
      </CModal>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  //<StrictMode>
  <MainApp />
  //</StrictMode>,
)
