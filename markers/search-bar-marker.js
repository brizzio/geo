class SearchMarker {
    constructor(map, result) {
        this.map = map;
        this.result = result;
        this.latlng = [result.lat, result.lon];
        this.marker = L.marker(this.latlng).addTo(this.map);
        this.marker.bindPopup(result.display_name).openPopup();
        this.flyToLocation();
    }

    flyToLocation() {
        this.map.flyTo(this.latlng, 14, {
            duration: 2 // Duration in seconds
        });
    }
}



