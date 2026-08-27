import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import ShipmentExplorer from "./components/ShipmentExplorer";

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
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
