import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import PopularThreats from './components/PopularThreats';
import NVDVulnerabilitySeverity from './components/NVDVulnerabilitySeverity';
import TopVulnerabilitiesList from './components/TopVulnerabilitiesList';
import CyberThreatMap from './components/ThreatMap';

function App() {
  return (
    <div className="bg-slate-800 min-h-screen">
      <Header />
      <div className="px-10 max-w-[1500px] w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <PopularThreats />
          <NVDVulnerabilitySeverity />
          <CyberThreatMap />
          <TopVulnerabilitiesList />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;