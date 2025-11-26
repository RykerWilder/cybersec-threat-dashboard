import './App.css';
import { useState } from 'react';
import { ReactSortable } from "react-sortablejs";
import Header from './components/Header';
import Footer from './components/Footer';
import PopularThreats from './components/PopularThreats';
import NVDVulnerabilitySeverity from './components/NVDVulnerabilitySeverity';
import TopVulnerabilitiesList from './components/TopVulnerabilitiesList';
import CyberThreatMap from './components/ThreatMap';

function App() {
  const [items, setItems] = useState([
    { id: 1, component: 'PopularThreats' },
    { id: 2, component: 'NVDVulnerabilitySeverity' },
    { id: 3, component: 'CyberThreatMap'},
    { id: 4, component: 'TopVulnerabilitiesList'}
  ]);

  const renderComponent = (item) => {
    switch(item.component) {
      case 'PopularThreats':
        return <PopularThreats />;
      case 'NVDVulnerabilitySeverity':
        return <NVDVulnerabilitySeverity />;
      case 'TopVulnerabilitiesList':
        return <TopVulnerabilitiesList/>
      case 'CyberThreatMap':
        return <CyberThreatMap/>
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800 min-h-screen">
      <Header />
      <div className="px-10 max-w-[1300px] w-full mx-auto">
        <ReactSortable
          list={items}
          setList={setItems}
          animation={150}
          ghostClass="opacity-50"
          dragClass="cursor-grabbing"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {items.map((item) => (
            <div key={item.id} className="cursor-grab active:cursor-grabbing">
              {renderComponent(item)}
            </div>
          ))}
        </ReactSortable>
      </div>
      <Footer />
    </div>
  );
}

export default App;