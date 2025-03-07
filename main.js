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

function mergeData(regionsGeoJSON, csvData) {
  regionsGeoJSON.features.forEach(feature => {
    const id = String(feature.properties.region_code);
    // console.log(`Обрабатываем GeoJSON feature с region_code: ${id}`); 

    let csvRecord = null;

    for (let i = 0; i < csvData.length; i++) {
      const csvRegionCode = csvData[i].region_code;
      // console.log(`Сравниваем с CSV region_code: ${csvRegionCode}`); 
      if (csvRegionCode === id) {
        csvRecord = csvData[i];
        // console.log(`Найдено соответствие для region_code: ${id}`); 
        break; // Нашли соответствие, выходим из цикла
      }
    }

    Object.assign(feature.properties, csvRecord);
  });
}

map.on('load', () => {
  map.addLayer({
    id: 'background',
    type: 'background',
    paint: {
      'background-color': 'lightblue'
    }
  })

  map.addSource('countries', {
    type: 'geojson',
    data: './data/countries.geojson',
    attribution: 'Natural Earth'
  })

  map.addLayer({
    id: 'countries-layer',
    type: 'fill',
    source: 'countries',
    paint: {
      'fill-color': 'lightgray'
    }
  })


  map.addSource('rivers', {
    type: 'geojson',
    data: './data/rivers.geojson'
  })

  map.addLayer({
    id: 'rivers-layer',
    type: 'line',
    source: 'rivers',
    paint: {
      'line-color': '#00BFFF'
    }
  })

  map.addSource('lakes', {
    type: 'geojson',
    data: './data/lakes.geojson'
  })

  map.addLayer({
    id: 'lakes-layer',
    type: 'fill',
    source: 'lakes',
    paint: {
      'fill-color': 'lightblue',
      'fill-outline-color': '#00BFFF'
    }
  })

  // map.addSource('regions', {
  //   type: 'geojson',
  //   data: './data/regions_ispr.geojson',
  //   promoteId: 'fid'
  // })

  let regionsGeoJSON;

  fetch('./data/regions_ispr.geojson')
    .then(response => response.json())
    .then(data => {
      regionsGeoJSON = data;
      // console.log(regionsGeoJSON)


      fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vS8FECP08E20R4RnOs3vbaHl3XqN3mvVyv7GjXGXDqUMcKu4eZqAtvczQqZUgXkJP4D62--Fmv26Yc2/pub?output=csv")
        .then((response) => response.text())
        .then((csv) => {
          const rows = Papa.parse(csv, { header: true });
          csvData = rows.data;
          // console.log(csvData)
          mergeData(regionsGeoJSON, csvData);
          console.log(regionsGeoJSON)
          map.addSource('regions', {
            type: 'geojson',
            data: regionsGeoJSON,
            promoteId: 'fid'
          });
          map.addLayer({
            id: 'regionslayer',
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

          let hoveredRegionsId = null;

          map.on('mousemove', 'regionslayer', (e) => {
            if (e.features.length > 0) {
              if (hoveredRegionsId) {
                map.setFeatureState(
                  { source: 'regions', id: hoveredRegionsId },
                  { hover: false }
                );
              }
              hoveredRegionsId = e.features[0].id; // присвоение нового идентификатора
              map.setFeatureState(
                { source: 'regions', id: hoveredRegionsId },
                { hover: true }
              );
            }
          });

          map.on('mouseleave', 'regionslayer', (e) => {
            if (hoveredRegionsId) {
              map.setFeatureState(
                { source: 'regions', id: hoveredRegionsId },
                { hover: false }
              );
            }
            hoveredRegionsId = null;
          });

          let mewedRegionsId = null;

          map.on('click', ['regionslayer'], (e) => {
            if (e.features.length > 0) {
              if (mewedRegionsId) {
                map.setFeatureState(
                  { source: 'regions', id: mewedRegionsId },
                  { mew: false }
                );
              }
              mewedRegionsId = e.features[0].id;
              map.setFeatureState(
                { source: 'regions', id: mewedRegionsId },
                { mew: true }
              );
              button.style.display = 'block'
            }
          });

          const button = document.getElementById('button');

          button.addEventListener('click', () => {
            if (mewedRegionsId) {
              console.log(mewedRegionsId)

              map.setFeatureState(
                { source: 'regions', id: mewedRegionsId },
                { mew: false }
              );

              button.style.display = 'none'
            }
            mewedRegionsId = null
          });

          map.on('mousemove', ['regionslayer'], (i) => {
            console.log(i.features)
            document.getElementById('region_name').innerHTML = i.features[0].properties.region_name
          })

          map.on('mousemove', (event) => {
            const lngLat = event.lngLat;
            // console.log(lngLat.lng)
            const lng = event.lngLat.lng
            document.getElementById('lng').innerHTML = `Долгота: ${lng}`
            // console.log(lngLat.lat)
            const lat = event.lngLat.lat
            document.getElementById('lat').innerHTML = `Широта: ${lat}`
          })

          regionsGeoJSON.features.map((f) => {
            document.getElementById("list-all").innerHTML += `<div class="list-item"> 
            <h4>${f.properties["Наименование субъекта Российской Федерации"]}</h4>
            <a href='#' onclick="map.flyTo({center: [${f.geometry.coordinates}], zoom: 10})">Найти на карте</a>
            <audio controls src="./Audio/Нижегородская область.mp3"></audio>
            </div><hr>`;
          });
        });
    })
});










