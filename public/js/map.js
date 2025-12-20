

const mapDiv = document.getElementById("map");
const locationString = mapDiv.dataset.location || "Bhopal, India";


fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}`)
  .then(response => response.json())
  .then(data => {
    if (data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];


      const map = L.map(mapDiv).setView(coords, 13);


      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);


      L.marker(coords).addTo(map)
        .bindPopup(`<b>${locationString}</b>`)
        .openPopup();

    } else {
      console.error("Location not found:", locationString);
    }
  })
  .catch(err => console.error("Geocoding error:", err));



