import "./App.css";
import Header from "./components/layout/Header";
import Home from "./pages/Home";

function App() {
  return (
    <div>
      <div className="flex flex-col min-h-dvh">
        <Header />
        <main>
          <Home />
        </main>
      </div>
    </div>
  );
}

export default App;
