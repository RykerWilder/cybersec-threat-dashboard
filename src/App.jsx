import './App.css';
import { useState } from 'react';
import { ReactSortable } from "react-sortablejs";
import Header from './components/Header';
import AttacksTypes from './components/AttacksTypes';

function App() {
  const [items, setItems] = useState([
    { id: 1, component: 'attacks' },
    { id: 2, component: 'chart1' },
    { id: 3, component: 'chart2' },
    { id: 4, component: 'chart3' }
  ]);

  const renderComponent = (item) => {
    switch(item.component) {
      case 'attacks':
        return <AttacksTypes key={item.id} />;
      case 'chart1':
        return (
          <div key={item.id} className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
            <canvas className="h-80"></canvas>
          </div>
        );
      case 'chart2':
        return (
          <div key={item.id} className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
            <canvas className="h-72"></canvas>
          </div>
        );
      case 'chart3':
        return (
          <div key={item.id} className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
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
        tag="main"
        list={items}
        setList={setItems}
        animation={150}
        ghostClass="sortable-ghost"
        className="p-10 columns-1 md:columns-2 gap-5 space-y-5 max-w-[1300px] w-full mx-auto"
      >
        {items.map((item) => renderComponent(item))}
      </ReactSortable>
    </div>
  );
}

export default App;