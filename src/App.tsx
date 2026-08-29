import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import ShipmentExplorer from "./components/ShipmentExplorer";
import Toast from "./components/Toast/Toast";

function App() {
  return (
    <ErrorBoundary
      fallback={<p>Something went wrong. Please reload the webpage</p>}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/shipments" replace />} />
          <Route path="/shipments" element={<ShipmentExplorer />} />
          <Route path="/shipments/:id" element={<ShipmentExplorer />} />
        </Routes>
        {/* No props - Toast subscribes directly to the toastStore, so any
            component anywhere (including a future Extra Credit route tree)
            can trigger it by importing `notify`, with no prop threading
            through App/ShipmentExplorer/etc. */}
        <Toast />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
