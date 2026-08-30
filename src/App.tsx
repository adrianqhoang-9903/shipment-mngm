import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DEFAULT_SHIPMENT_LIST_PATH } from "./constants";
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
          <Route path="/" element={<Navigate to={DEFAULT_SHIPMENT_LIST_PATH} replace />} />
          <Route path="/shipments" element={<ShipmentExplorer />} />
          <Route path="*" element={<Navigate to={DEFAULT_SHIPMENT_LIST_PATH} replace />} />
        </Routes>
        <Toast />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
