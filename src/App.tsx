import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProvider } from "@/features/AppContext";
import { Layout } from "@/pages/Layout";
import { SandboxHome } from "@/pages/SandboxHome";
import { EventPage } from "@/pages/EventPage";
import { LoginPage } from "@/pages/LoginPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<SandboxHome />} />
            <Route path="/evento/:id" element={<EventPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
