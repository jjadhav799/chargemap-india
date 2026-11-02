import { useEffect, useMemo, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import {
  Activity, BatteryCharging, MapPin, Search, Zap, Menu,
  Filter, LocateFixed, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

const API = 'https://ev-charging-stations-api.vercel.app/v1';
const PAGE_SIZE = 100;

type Charger = {
  type_raw: string;
  standards: string[];
  charger_kw: number;
  connectors_per_charger: number;
  count: number;
};

type Station = {
  id: string;
  operator: string;
  ownership: string;
  state: string;
  state_code: string;
  district: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  location_quality: string;
  chargers: Charger[];
  total_chargers: number;
  total_connectors: number;
  max_power_kw: number;
  standards: string[];
  currents: string[];
  vehicle_classes: string[];
};

type StateInfo = {
  name: string;
  code: string;
  stations: number;
  chargers: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  error?: string;
};

export default function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('All states');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [selected, setSelected] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the state and territory list once.
  useEffect(() => {
    fetch(`${API}/states`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load states');
        return response.json();
      })
      .then((result: ApiResponse<StateInfo[]>) => {
        if (result.success) setStates(result.data);
      })
      .catch(() => setError('Unable to load state information. Please refresh.'));
  }, []);

  // Debounce search to avoid unnecessary API requests while typing.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query]);

  // Fetch only the selected page and active filters.
  useEffect(() => {
    const controller = new AbortController();

    async function loadStations() {
      setLoading(true);
      setError('');
      setSelected(null);

      const params = new URLSearchParams({
        location_quality: 'ok',
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (stateFilter !== 'All states') {
        params.set('state', stateFilter);
      }

      if (currentFilter !== 'all') {
        params.set('current', currentFilter);
      }

      if (debouncedQuery) {
        params.set('city', debouncedQuery);
      }

      try {
        const response = await fetch(`${API}/stations?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API request failed (${response.status})`);
        }

        const result: ApiResponse<Station[]> = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Station data unavailable');
        }

        setStations(result.data);
        setTotal(result.meta?.total ?? result.data.length);
        setTotalPages(result.meta?.total_pages ?? 1);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
          setStations([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadStations();
    return () => controller.abort();
  }, [page, stateFilter, currentFilter, debouncedQuery]);

  const pageChargers = useMemo(
    () => stations.reduce((sum, station) => sum + station.total_chargers, 0),
    [stations]
  );

  const pageDC = stations.filter((station) => station.currents.includes('DC')).length;
  const pageAC = stations.filter((station) => station.currents.includes('AC')).length;

  function changeState(value: string) {
    setStateFilter(value);
    setPage(1);
  }

  function changeCurrent(value: string) {
    setCurrentFilter(value);
    setPage(1);
  }

  function formatPower(power: number) {
    return Number.isInteger(power) ? String(power) : power.toFixed(1);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Zap size={22} fill="currentColor" /></div>
          <div>
            <strong>ChargeMap <span>India</span></strong>
            <small>EV INFRASTRUCTURE INTELLIGENCE</small>
          </div>
        </div>
        <div className="topbar-right">
          <span className="live-dot" /> INDIA NETWORK OVERVIEW
          <button className="icon-btn" aria-label="Menu"><Menu /></button>
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">THE ELECTRIC MOBILITY LANDSCAPE</p>
          <h1>India's charging network, <span>mapped.</span></h1>
          <p className="subtitle">
            Explore public EV charging infrastructure across India's cities and states.
          </p>
        </div>
        <div className="data-pill">
          <Activity size={15} /> BEE PUBLIC DATA <span>•</span> 26 OCT 2025
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon"><MapPin /></div>
          <div>
            <small>FILTERED STATIONS</small>
            <strong>{total.toLocaleString('en-IN')}</strong>
            <span>Matching API records</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon"><Zap /></div>
          <div>
            <small>CHARGERS ON PAGE</small>
            <strong>{pageChargers.toLocaleString('en-IN')}</strong>
            <span>Across current results</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon"><BatteryCharging /></div>
          <div>
            <small>DC STATIONS ON PAGE</small>
            <strong>{pageDC}</strong>
            <span>Direct current</span>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon"><Activity /></div>
          <div>
            <small>AC STATIONS ON PAGE</small>
            <strong>{pageAC}</strong>
            <span>Alternating current</span>
          </div>
        </article>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <div className="section-title">
            <Filter size={17} /><strong>Explore stations</strong>
          </div>

          <label className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search city..."
            />
          </label>

          <label className="filter-label">STATE / TERRITORY</label>
          <select value={stateFilter} onChange={(event) => changeState(event.target.value)}>
            <option value="All states">All states</option>
            {states.map((state) => (
              <option key={state.code} value={state.code}>{state.name}</option>
            ))}
          </select>

          <label className="filter-label">CURRENT TYPE</label>
          <select value={currentFilter} onChange={(event) => changeCurrent(event.target.value)}>
            <option value="all">AC + DC</option>
            <option value="dc">DC</option>
            <option value="ac">AC</option>
          </select>

          <div className="sidebar-divider" />

          <div className="section-title">
            <MapPin size={17} />
            <strong>Station directory</strong>
            <span className="count">{total.toLocaleString('en-IN')}</span>
          </div>

          <div className="station-list">
            {loading && (
              <p className="empty"><RefreshCw size={15} /> Loading charging stations...</p>
            )}

            {!loading && error && <p className="error-message">{error}</p>}

            {!loading && !error && stations.map((station) => (
              <button
                key={station.id}
                className={`station-row ${selected?.id === station.id ? 'selected' : ''}`}
                onClick={() => setSelected(station)}
              >
                <span className="station-dot" />
                <span className="station-info">
                  <strong>{station.operator || 'Unknown operator'}</strong>
                  <small>{station.city}, {station.state}</small>
                </span>
                <span className="power">
                  {formatPower(station.max_power_kw)}
                  <small>kW</small>
                </span>
              </button>
            ))}

            {!loading && !error && stations.length === 0 && (
              <p className="empty">No stations match these filters.</p>
            )}
          </div>

          <div className="pagination">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span>Page {page} of {totalPages.toLocaleString('en-IN')}</span>
            <button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || loading}
              aria-label="Next page"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>

          <p className="disclaimer">
            Source: Bureau of Energy Efficiency (BEE), Ministry of Power, Government of India.
            Dataset snapshot: 26 October 2025. Republished with attribution; this is not an
            official BEE service. Operational status and live availability are not provided.
          </p>
        </aside>

        <div className="map-panel">
          <div className="map-label">
            <LocateFixed size={15} /> INDIA · EV CHARGING EXPLORER
          </div>

          <Map
            initialViewState={{ longitude: 79, latitude: 22, zoom: 4.25 }}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          >
            <NavigationControl position="bottom-right" />
            {stations.map((station) => (
              <Marker
                key={station.id}
                longitude={station.longitude}
                latitude={station.latitude}
                anchor="bottom"
                onClick={(event) => {
                  event.originalEvent.stopPropagation();
                  setSelected(station);
                }}
              >
                <button
                  className={`map-marker ${selected?.id === station.id ? 'active' : ''}`}
                  title={`${station.operator} - ${station.city}`}
                >
                  <Zap size={14} fill="currentColor" />
                </button>
              </Marker>
            ))}
          </Map>

          {selected && (
            <div className="station-popup">
              <button className="close-popup" onClick={() => setSelected(null)}>×</button>
              <small>SELECTED CHARGING STATION</small>
              <strong>{selected.operator}</strong>
              <span>{selected.city}, {selected.district}, {selected.state}</span>
              <span>{selected.address}</span>
              <b>{formatPower(selected.max_power_kw)} kW · {selected.currents.join(' / ')}</b>
              <span>{selected.total_chargers} chargers · {selected.total_connectors} connectors</span>
              <span>{selected.standards.join(', ') || 'Connector details unavailable'}</span>
            </div>
          )}

          <div className="map-legend">
            <span><i className="legend-fast" /> DC Charger</span>
            <span><i className="legend-ac" /> AC Charger</span>
          </div>
          <div className="map-attribution">
            Map tiles © CARTO · © OpenStreetMap contributors
          </div>
        </div>
      </section>

      <footer>
        CHARGEMAP INDIA <span>·</span> BEE PUBLIC DATA EXPLORER
        <span>·</span> AWS BUILDER CHALLENGE 2026
      </footer>
    </main>
  );
}
