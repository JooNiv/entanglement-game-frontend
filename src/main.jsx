import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import { TopBar } from './components/TopBar.jsx'
import { QrModal } from './components/QrModal.jsx'
import { AdminModal } from './components/AdminModal.jsx'

// metadata
document.title = 'Quantum Entanglement Game'

function MainApp() {
  const [showQRModal, setShowQRModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "")
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeDevice, setActiveDevice] = useState('')
  

  const currentUrl = window.location.href
  const backendUrl = import.meta.env.VITE_backendUrl || "";

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
        const res = await fetch(`${backendUrl}/admin/check_token`, {
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

  return (
    <div>
      <TopBar setShowAdminModal={setShowAdminModal} setShowQRModal={setShowQRModal} />

      <App isAdmin={isAdmin} token={token} activeDevice={activeDevice} />

      <AdminModal
        activeDevice={activeDevice}
        setActiveDevice={setActiveDevice}
        showAdminModal={showAdminModal}
        setShowAdminModal={setShowAdminModal}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        token={token}
        setToken={setToken}
        backendUrl={backendUrl}
      />

      <QrModal showQRModal={showQRModal} setShowQRModal={setShowQRModal} currentUrl={currentUrl} />
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  //<StrictMode>
  <MainApp />
  //</StrictMode>,
)
