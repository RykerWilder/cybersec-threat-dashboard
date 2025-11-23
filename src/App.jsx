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
        return <AttacksTypes />;
      case 'malware':
        return <Malware />;
      case 'threats':
        return <Threats />;
      case 'chart3':
        return (
          <div className="border border-stone-500 rounded-lg p-4 bg-slate-700">
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
      <div className="p-10 max-w-[1300px] w-full mx-auto">
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
    </div>
  );
}

export default App;