import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

const ArgoMap = ({ markers = [], center = [15.0, 75.0] }) => {
  if (!markers || markers.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400 text-sm">
        No geographic coordinates available to display on the map.
      </div>
    );
  }

  // Calculate dynamic center if markers are provided
  const mapCenter = markers.length > 0 && markers[0].coordinates 
    ? markers[0].coordinates 
    : [15.0, 75.0];

  const getColor = (temp) => {
    if (temp === null || temp === undefined) return '#0ea5e9';
    if (temp > 28) return '#ef4444'; // Red for very warm tropical waters
    if (temp > 24) return '#f97316'; // Orange
    if (temp > 18) return '#eab308'; // Amber
    if (temp > 10) return '#06b6d4'; // Cyan
    return '#3b82f6'; // Cold deep blue
  };

  return (
    <div className="w-full flex flex-col space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Interactive ARGO Profiling Float Array Map</span>
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>&gt; 28°C</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>20–28°C</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>&lt; 20°C</span>
          </span>
        </div>
      </div>

      <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl relative z-10">
        <MapContainer
          center={mapCenter}
          zoom={4}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* CartoDB Dark Matter ocean tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {markers.map((m, idx) => (
            <CircleMarker
              key={m.id || idx}
              center={m.coordinates}
              radius={6}
              pathOptions={{
                fillColor: getColor(m.temperature),
                fillOpacity: 0.85,
                color: '#ffffff',
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="p-1 space-y-1.5 text-xs font-sans">
                  <div className="border-b border-slate-700 pb-1 flex items-center justify-between">
                    <span className="font-bold text-cyan-400">
                      Float #{m.floatId}
                    </span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                      Cycle {m.cycleNumber}
                    </span>
                  </div>
                  <div className="space-y-0.5 text-slate-300">
                    <p>
                      Region: <span className="font-semibold text-white">{m.region}</span>
                    </p>
                    <p>
                      Date: <span className="text-slate-400">{new Date(m.timestamp).toLocaleDateString()}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Pos: {m.coordinates[0]?.toFixed(2)}°N, {m.coordinates[1]?.toFixed(2)}°E
                    </p>
                    {m.temperature !== null && (
                      <p className="text-cyan-400">
                        Surface Temp: <span className="font-bold">{m.temperature} °C</span>
                      </p>
                    )}
                    {m.salinity !== null && (
                      <p className="text-emerald-400">
                        Salinity: <span className="font-bold">{m.salinity} PSU</span>
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <p className="text-[11px] text-slate-500 italic">
        * Displaying real-time positioning and surface observations for {markers.length} ARGO cycles. Click any float marker for sensor metadata.
      </p>
    </div>
  );
};

export default ArgoMap;
