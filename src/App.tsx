import { useMemo, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import { Activity, BatteryCharging, MapPin, Search, Zap, Menu, Filter, LocateFixed } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

type Station = {
  id: number;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  power: number;
  type: string;
};

const stations: Station[] = [
  { id: 1, name: 'EV Hub Connaught Place', city: 'New Delhi', state: 'Delhi', lat: 28.6315, lng: 77.2167, power: 60, type: 'DC Fast' },
  { id: 2, name: 'Charging Point BKC', city: 'Mumbai', state: 'Maharashtra', lat: 19.0596, lng: 72.8656, power: 120, type: 'DC Fast' },
  { id: 3, name: 'EV Station Hinjewadi', city: 'Pune', state: 'Maharashtra', lat: 18.5912, lng: 73.7389, power: 30, type: 'AC' },
  { id: 4, name: 'Bengaluru EV Hub', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, power: 150, type: 'DC Fast' },
  { id: 5, name: 'Chennai Charging Plaza', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, power: 50, type: 'DC Fast' },
  { id: 6, name: 'Hyderabad EV Point', city: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867, power: 30, type: 'AC' },
  { id: 7, name: 'Kolkata Green Charge', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, power: 60, type: 'DC Fast' },
  { id: 8, name: 'Jaipur EV Station', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, power: 22, type: 'AC' },
  { id: 9, name: 'Ahmedabad Charge Point', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, power: 100, type: 'DC Fast' },
  { id: 10, name: 'Kochi EV Hub', city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, power: 50, type: 'DC Fast' },
  { id: 11, name: 'Nagpur Charging Point', city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, power: 30, type: 'AC' },
  { id: 12, name: 'Lucknow EV Station', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, power: 60, type: 'DC Fast' },
];

export default function App() {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('All states');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [selected, setSelected] = useState<Station | null>(null);

  const filtered = useMemo(() => stations.filter((s) =>
    (stateFilter === 'All states' || s.state === stateFilter) &&
    (typeFilter === 'All types' || s.type === typeFilter) &&
    `${s.name} ${s.city} ${s.state}`.toLowerCase().includes(query.toLowerCase())
  ), [query, stateFilter, typeFilter]);

  const states = [...new Set(stations.map((s) => s.state))].sort();

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Zap size={22} fill="currentColor" /></div>
          <div><strong>ChargeMap <span>India</span></strong><small>EV INFRASTRUCTURE INTELLIGENCE</small></div>
        </div>
        <div className="topbar-right"><span className="live-dot" /> INDIA NETWORK OVERVIEW <button className="icon-btn"><Menu /></button></div>
      </header>

      <section className="page-heading">
        <div><p className="eyebrow">THE ELECTRIC MOBILITY LANDSCAPE</p><h1>India's charging network, <span>mapped.</span></h1><p className="subtitle">Explore electric vehicle charging infrastructure across India's cities and states.</p></div>
        <div className="data-pill"><Activity size={15} /> DEMO DATASET <span>•</span> SAMPLE LOCATIONS</div>
      </section>

      <section className="stats-grid">
        <article className="stat-card"><div className="stat-icon"><MapPin /></div><div><small>LOCATIONS SHOWN</small><strong>{filtered.length}</strong><span>In this demo view</span></div></article>
        <article className="stat-card"><div className="stat-icon"><Zap /></div><div><small>DC FAST CHARGERS</small><strong>{filtered.filter(s => s.type === 'DC Fast').length}</strong><span>Sample locations</span></div></article>
        <article className="stat-card"><div className="stat-icon"><BatteryCharging /></div><div><small>AC CHARGERS</small><strong>{filtered.filter(s => s.type === 'AC').length}</strong><span>Sample locations</span></div></article>
        <article className="stat-card"><div className="stat-icon"><Activity /></div><div><small>STATES COVERED</small><strong>{new Set(filtered.map(s => s.state)).size}</strong><span>Across India</span></div></article>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <div className="section-title"><Filter size={17} /><strong>Explore stations</strong></div>
          <label className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search city or station..." /></label>
          <label className="filter-label">STATE / TERRITORY</label>
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}><option>All states</option>{states.map(s => <option key={s}>{s}</option>)}</select>
          <label className="filter-label">CHARGER TYPE</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option>All types</option><option>DC Fast</option><option>AC</option></select>
          <div className="sidebar-divider" />
          <div className="section-title"><MapPin size={17} /><strong>Station directory</strong><span className="count">{filtered.length}</span></div>
          <div className="station-list">
            {filtered.map(s => <button key={s.id} className={`station-row ${selected?.id === s.id ? 'selected' : ''}`} onClick={() => setSelected(s)}>
              <span className="station-dot" /><span className="station-info"><strong>{s.name}</strong><small>{s.city}, {s.state}</small></span><span className="power">{s.power}<small>kW</small></span>
            </button>)}
            {filtered.length === 0 && <p className="empty">No stations match these filters.</p>}
          </div>
          <p className="disclaimer">Illustrative sample locations only. Not verified operational charging points.</p>
        </aside>

        <div className="map-panel">
          <div className="map-label"><LocateFixed size={15} /> INDIA · EV CHARGING EXPLORER</div>
          <Map initialViewState={{ longitude: 79, latitude: 22, zoom: 4.25 }} mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json">
            <NavigationControl position="bottom-right" />
            {filtered.map(s => <Marker key={s.id} longitude={s.lng} latitude={s.lat} anchor="bottom" onClick={e => { e.originalEvent.stopPropagation(); setSelected(s); }}>
              <button className={`map-marker ${selected?.id === s.id ? 'active' : ''}`} title={s.name}><Zap size={14} fill="currentColor" /></button>
            </Marker>)}
          </Map>
          {selected && <div className="station-popup"><button className="close-popup" onClick={() => setSelected(null)}>×</button><small>SELECTED STATION</small><strong>{selected.name}</strong><span>{selected.city}, {selected.state}</span><b>{selected.power} kW · {selected.type}</b></div>}
          <div className="map-legend"><span><i className="legend-fast" /> DC Fast</span><span><i className="legend-ac" /> AC Charger</span></div>
          <div className="map-attribution">Map tiles © CARTO · © OpenStreetMap contributors</div>
        </div>
      </section>
      <footer>CHARGEMAP INDIA <span>·</span> A PUBLIC-DATA EXPLORATION PROJECT <span>·</span> AWS BUILDER CHALLENGE 2026</footer>
    </main>
  );
}
