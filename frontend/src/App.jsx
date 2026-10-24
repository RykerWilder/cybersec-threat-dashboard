import { useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import DashboardPage from "./pages/DashboardPage";
import LayoutEditorPage from "./pages/LayoutEditorPage";
import { useRoute } from "./layout/hooks";

function App() {
  const route = useRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  return (
    <div id="top" className="relative min-h-screen bg-ink-950 text-fg">
      <a
        href="#main"
        onClick={(event) => {
          // Keep the hash for routing; just move focus to the content.
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="sr-only z-50 rounded-md bg-accent px-3 py-2 font-medium text-ink-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[520px]" />

      <Header />

      <main id="main" tabIndex={-1} className="relative focus:outline-none mx-auto w-full max-w-[1560px] px-5 pb-4 pt-10 lg:px-10">
        {route === "layout" ? <LayoutEditorPage /> : <DashboardPage />}
      </main>

      <Footer />
    </div>
  );
}

export default App;
