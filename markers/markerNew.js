class MarkerNew {
    constructor(mapContext, latlng, options = {}) {
        this.mapContext = mapContext;
        this.map = this.mapContext.map;
        this.latlng = latlng || null;
        this.selected = false;
        this.visited = false;
        this.menus = [
            { id: 'delete', text: 'Remover', onClick: this.deleteMarker.bind(this) }
        ];

        this.popupContent = 'popup content';
        this.title = 'novo marcador';
        this.icon = new StackedIcon(this.title);
        this.options = Object.assign(options, {
            icon: this.icon.element
        });

        // Check if marker already exists at this location
        if (!this.isMarkerAlreadyPresent()) {
            this.addMarker();
            this.flyToLocation();
        }

        this.map.on('zoomend', this.update.bind(this));
    }

    addMarker() {
        if (this.marker) return;

        this.marker = L.marker(this.latlng, this.options);
        this.marker.bindPopup(this.popupContent);

        // Set up the custom context menu
        this.contextMenu = new ContextMenu(this.menus);

        this.marker.on('contextmenu', (event) => {
            this.contextMenu.hideContextMenus();
            this.showContextMenu(event);
        });

        this.marker.on('click', () => {
            this.selected = !this.selected;
            this.visited = true;
            console.log('clicked', this);
            this.contextMenu.removeContextMenu();
            this.update();
        });

        this.update();
    }

    update() {
        console.log('updating marker', this, this.selected, this.visited);
        this.icon.setSelected(this.selected, this.visited);
        this.icon.updateVisibility(this.map);

        // Update the marker icon directly
        if (this.marker) {
            this.marker.setIcon(this.icon.element);
        }
    }

    draw() {
        console.log('draw marker', this);
        try {
            if (this.marker && !this.map.hasLayer(this.marker)) {
                this.map.addLayer(this.marker);
            }

            if (this.selected) {
                this.marker.openPopup();
            } else {
                this.marker.closePopup();
            }
        } catch (error) {
            console.log('search mark draw error', error, this);
        }
    }

    generatePopupContent() {
        console.log('calling store marker popup', this.info);
        let header = `<strong>Store Id:</strong> ${this.id}<br><strong>Store Name:</strong> ${this.name}<br>`;
        let data = Object.keys(this.info).map(tag => `<strong>${tag}:</strong> ${this.info[tag]}`).join('<br>');
        return header + data;
    }

    deleteMarker() {
        console.log('Delete marker clicked');
        this.map.removeLayer(this.marker);
        this.contextMenu.removeContextMenu();
    }

    selectMarker() {
        console.log('Select marker clicked');
        this.mapContext.selectedMarker = this;
        console.log('selectedMarker', this);
        console.log('selectedMarkerObject', this.objectify());
        this.contextMenu.hideContextMenus();
    }

    objectify() {
        const plainObject = {};

        for (const key in this) {
            if (this.hasOwnProperty(key)) {
                plainObject[key] = this[key];
            }
        }

        const keysToDelete = ['mapContext', 'contextMenu', 'iconUrl', 'marker', 'popupContent'];

        keysToDelete.forEach(key => delete plainObject[key]);

        return plainObject;
    }

    showContextMenu(event) {
        L.DomEvent.stopPropagation(event);

        let left = `${event.containerPoint.x}px`;
        let top = `${event.containerPoint.y}px`;

        this.contextMenu.createContextMenu(top, left);

        this.mapContext.contextMenuLatLng = event.latlng;
        this.mapContext.selectedMarker = this;
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
        console.log('checking', markerAlreadyPresent);
        return markerAlreadyPresent;
    }

    flyToLocation() {
        this.map.flyTo(this.latlng, 14, {
            duration: 2 // Duration in seconds
        });
    }
}
