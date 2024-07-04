class SearchMarker {
    constructor(map, result) {
        this.mapContext = map;
        this.result = result;
        this.latlng = [result.lat, result.lon];
        this.marker = null;
        this.selected = false

        

        // Check if marker already exists at this location
        if (!this.isMarkerAlreadyPresent()) {
            this.addMarker();
            this.flyToLocation();
        }
    }

    addMarker() {
        if (this.marker) return;
        this.marker = L.marker(this.latlng).addTo(this.mapContext);
        this.marker.bindPopup(this.result.display_name).openPopup();

         // Set up the custom context menu
         this.contextMenu = new ContextMenu([
            { id: 'set-headquarter', text: 'Matriz', onClick: this.setHeadquarter.bind(this) },
            { id: 'set-branch', text: 'Filial', onClick: this.setBranch.bind(this) },
            { id: 'set-concurrent', text: 'Concorrente', onClick: this.setConcurrent.bind(this) },
            { id: 'delete', text: 'Remover', onClick: this.remove.bind(this) }
        ]); 

        this.marker.on('contextmenu', (event) => {
            this.contextMenu.hideContextMenus();
            this.showContextMenu(event);
        });

        this.marker.on('click', () => {
            this.mapContext.selectedMarker = this;
            this.contextMenu.removeContextMenu();
        });

        
    }

    showContextMenu(event) {
        L.DomEvent.stopPropagation(event);

        let left = `${event.containerPoint.x}px`;
        let top = `${event.containerPoint.y}px`;

        this.contextMenu.createContextMenu(top, left);

        this.marker.closePopup()
        this.mapContext.selectedMarker = this;
    }


    setHeadquarter(){
        console.log('click on menu headquarter')
        this.selected = true
        this.contextMenu.removeContextMenu();
    }

    setBranch(){
        console.log('click on menu Branch')
        this.selected = true
        this.contextMenu.removeContextMenu();
    }

    setConcurrent(){
        console.log('click on menu Concurrent')
        this.selected = true
        this.contextMenu.removeContextMenu();
    }

    remove(){
        console.log('click on menu Remove')
        this.mapContext.removeLayer(this.marker);
        this.contextMenu.removeContextMenu();
    }

    isMarkerAlreadyPresent() {
        
        
        let markerAlreadyPresent = false;
        this.mapContext.eachLayer((layer) => {
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
        this.mapContext.flyTo(this.latlng, 14, {
            duration: 2 // Duration in seconds
        });
    }
}




