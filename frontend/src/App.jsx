import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import PopularThreats from './components/PopularThreats';
import NVDVulnerabilitySeverity from './components/NVDVulnerabilitySeverity';
import TopVulnerabilitiesList from './components/TopVulnerabilitiesList';
import CyberThreatMap from './components/ThreatMap';
import AttacksTrend from './components/AttacksTrends';

function App() {
  return (
    <div className="bg-slate-800 min-h-screen max-w-[1500px]">
      <Header />
      <div className="px-10 max-w-[1500px] mx-auto">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5 w-full">
            <PopularThreats />
            <NVDVulnerabilitySeverity />
          </div>
          <div className="flex gap-5">
            <iframe width="900" height="500" src="https://cybermap.kaspersky.com/en/widget/dynamic/dark" frameborder="0"></iframe>
            <TopVulnerabilitiesList />
          </div>
          <AttacksTrend />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;