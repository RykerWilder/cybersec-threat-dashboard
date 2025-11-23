import './App.css';
import { useState } from 'react';
import { ReactSortable } from "react-sortablejs";
import Header from './components/Header';
import AttacksTypes from './components/AttacksTypes';
import Malware from './components/Malware';
import Threats from './components/Threats';

function App() {
  const [items, setItems] = useState([
    { id: 1, component: 'attacks' },
    { id: 2, component: 'malware' },
    { id: 3, component: 'threats' },
    { id: 4, component: 'chart3' }
  ]);

  const renderComponent = (item) => {
    switch(item.component) {
      case 'attacks':
        return <AttacksTypes key={item.id} />;
      case 'malware':
        return <Malware key={item.id} />;
      case 'threats':
        return <Threats key={item.id} />;
      case 'chart3':
        return (
          <div key={item.id} className="border border-stone-500 rounded-lg p-4 bg-slate-700 mb-5">
            <canvas className="h-96"></canvas>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800 min-h-screen">
      <Header />
      <ReactSortable
        list={items}
        setList={setItems}
        animation={150}
        ghostClass="sortable-ghost"
        dragClass="sortable-drag"
        forceFallback={true} 
        className="p-10 columns-1 md:columns-2 gap-5 max-w-[1300px] w-full mx-auto"
        style={{ position: 'relative' }}
      >
        {items.map((item) => (
          <div key={item.id} className="mb-5">
            {renderComponent(item)}
          </div>
        ))}
      </ReactSortable>
    </div>
  );
}

export default App;