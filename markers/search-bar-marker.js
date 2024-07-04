class SearchMarker {
    constructor(map, result) {
        this.map = map;
        this.result = result;
        this.latlng = [result.lat, result.lon];
        this.marker = null;

        // Check if marker already exists at this location
        if (!this.isMarkerAlreadyPresent()) {
            this.addMarker();
            this.flyToLocation();
        }
    }

    addMarker() {
        this.marker = L.marker(this.latlng).addTo(this.map);
        this.marker.bindPopup(this.result.display_name).openPopup();

        
    }

    isMarkerAlreadyPresent() {
        
        
        let markerAlreadyPresent = false;
        this.map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                const markerLatLng = layer.getLatLng();
                if (markerLatLng.lat === this.latlng[0] && markerLatLng.lng === this.latlng[1]) {
                    markerAlreadyPresent = true;
                }
            }
        });
        console.log('checking', markerAlreadyPresent)
        return markerAlreadyPresent;
    }

    flyToLocation() {
        this.map.flyTo(this.latlng, 14, {
            duration: 2 // Duration in seconds
        });
    }
}



