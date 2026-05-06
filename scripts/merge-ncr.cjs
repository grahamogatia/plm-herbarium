const fs = require('fs');
const d = JSON.parse(fs.readFileSync('public/philippines-provinces.json', 'utf8'));

const ncrNames = new Set([
  'NCR, City of Manila, First District',
  'NCR, Fourth District',
  'NCR, Second District',
  'NCR, Third District',
]);

const ncrFeatures = d.features.filter(f => ncrNames.has(f.properties.ADM2_EN));
const otherFeatures = d.features.filter(f => !ncrNames.has(f.properties.ADM2_EN));

const allPolygons = [];
for (const feat of ncrFeatures) {
  const geom = feat.geometry;
  if (geom.type === 'Polygon') {
    allPolygons.push(geom.coordinates);
  } else if (geom.type === 'MultiPolygon') {
    allPolygons.push(...geom.coordinates);
  }
}

const ncrCombined = {
  type: 'Feature',
  geometry: { type: 'MultiPolygon', coordinates: allPolygons },
  properties: { ...ncrFeatures[0].properties, ADM2_EN: 'Metro Manila' },
};

d.features = [...otherFeatures, ncrCombined];
fs.writeFileSync('public/philippines-provinces.json', JSON.stringify(d));
console.log('Done. Total features:', d.features.length);
