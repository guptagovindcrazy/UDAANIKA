// Embeds OpenStreetMap (no API key, no map library) around a coordinate.
export default function LocationMap({ latitude, longitude, height = 220 }) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon) || latitude === '' || longitude === '') return null;
  const d = 0.008;
  const bbox = [lon - d, lat - d, lon + d, lat + d].join(',');
  return (
    <div className="map">
      <iframe
        title="Rescue location map"
        height={height}
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
      />
      <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`} target="_blank" rel="noreferrer">Open larger map ↗</a>
    </div>
  );
}
