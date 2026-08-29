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
          <Route path="*" element={<Navigate to="/shipments" replace />} />
        </Routes>
        <Toast />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
