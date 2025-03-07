const map = new maplibregl.Map({
    container: 'map', // container id
    style: {
      "version": 8,
      "sources": {},
      "layers": []
    },
    center: [37, 55], // starting position [lng, lat]
    zoom: 5, // starting zoom
  })

map.addSource('regions', {
    type: 'geojson',
    data: './data/regions_ispr.geojson',
    promoteId: 'fid'
  })

  map.addLayer({
    id: 'regions-layer',
    type: 'fill',
    source: 'regions',
    paint: {
      'fill-color': '#627BC1',
      'fill-outline-color': [
        'case',
        ['boolean', ['feature-state', 'mew'], false],
        'purple',
        'green'
      ],
      'fill-opacity': [
        'case', //ключевое слово в выражении MapLibre GL, которое позволяет задать условные правила
        ['boolean', ['feature-state', 'hover'], false], //Эта часть проверяет, установлено ли свойство hover в true для текущего региона
        1,
        0.5
      ]
    }
  });
// const csvResponse = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vS8FECP08E20R4RnOs3vbaHl3XqN3mvVyv7GjXGXDqUMcKu4eZqAtvczQqZUgXkJP4D62--Fmv26Yc2/pub?output=csv');
// const csvText = await csvResponse.text();
// const csvRows = Papa.parse(csvText, {header: true}).data;
// const matchedFeatures = matchCsvToGeoJson(csvRows, geoJsonData.features)