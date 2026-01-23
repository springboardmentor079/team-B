import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Petitions from "./pages/Petitions";
import CreatePetition from "./pages/CreatePetition";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/petitions" element={<Petitions />} />
          <Route path="/create" element={<CreatePetition />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
