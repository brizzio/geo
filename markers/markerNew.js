class MarkerNew {
    constructor(mapContext, options = {}) {
        this.mapContext = mapContext;
        this.map = this.mapContext.map;
        //this.latlng = latlng || null;
    
        this._fly = false
        this._face = null
        this.isDeleted = false;
        this.options = options

        this.menus = [
            { id: 'delete', text: 'Remover', onClick: this.deleteMarker.bind(this) }
        ];

        
        
        this.popupContent = this.name
        ?this.generatePopupContent(this.data)
        :'popup content'
       

        // Add a unique id to prevent duplicate markers
        //this.id = `${this.latlng[0]}_${this.latlng[1]}`;


        // Check if marker already exists before adding
       /*  if (!this.mapContext.markerStore) {
            this.mapContext.markerStore = {};
        } */

      /*   console.log('Marker stores:',this.mapContext.markerStore);
        if (!this.mapContext.markerStore[this.id]) {
            //this.addMarker();
            this.mapContext.markerStore[this.id] = this;
            
        } else {
            console.log('Marker already exists:', this.id);
        } */

            this.map.on('zoomend', this.update.bind(this));
       
       
    }


    get face(){
        return this._face || 'fa-bullseye'
    }

    set face(faIconName){
        this._face = faIconName
    }

    get selected(){
        return this._selected
    }

    set selected(bool){
        this._selected = bool
    }

    get visited(){
        return this._visited
    }

    set visited(bool){
        this._visited = bool
    }

    set fly(bool){
        this._fly = bool
    }

    get fly(){
        return this._fly
    }

    get boxSize(){
        return this._boxSize || 80
    }

    set boxSize(size){
        this._boxSize = size
    }


    get boundingBox(){
        return this.getBoundingBox()
    }

    
    addMarker() {
        if (this.isDeleted || this.marker) return;
        // Check if marker already exists at this location
       

        this.icon = new StackedIcon(this.title, this.face, this.selected, this.visited);
        
        this.options = Object.assign(this.options, {
            icon: this.icon.element
        });

        this.marker = L.marker(this.latlng, this.options);
        this.marker.bindPopup(this.popupContent);

        // Set up the custom context menu
        this.contextMenu = new ContextMenu(this.menus);

        this.marker.on('contextmenu', (event) => {
            this.contextMenu.hideContextMenus();
            this.showContextMenu(event);
        });

        this.marker.on('click', async () => {
            this.selected = !this.selected;
            this.visited = true;
            console.log('clicked', this);
            await this.geoUpdate(this.selected, this.visited)
            this.contextMenu.removeContextMenu();
            
            this.update();
        });

       
        

        this.draw();
    }

    update() {
        if (this.isDeleted) {
            console.log('Marker is deleted, skipping update');
            return; // Don't update if deleted
        }
        console.log('updating marker', this, this.selected, this.visited);
        console.log('layers', this.getAllLayers(this.mapContext.map));
        this.icon.setSelected(this.selected, this.visited);
        this.icon.updateVisibility(this.map);

        // Update the marker icon directly
        if (this.marker) {
            
            this.marker.setIcon(this.icon.element);
            this.marker.bindPopup(this.popupContent); // Update popup content here
        }
        
    }

    // Define geoUpdate method
    async geoUpdate(selected, visited) {
        console.log('geoUpdate called', { selected, visited });
        // Simulate an async operation (e.g., a network request)
        return new Promise(resolve => setTimeout(() => {
            const id = this._data.id
            let geo = {
                ... this._data.geo,
                visited,
                selected,
            }
            const updatedData = {...this._data, geo}
            console.log('geoUpdate operation completed',id, updatedData, this._model.table);
            this._model.table.update(id, updatedData)
            this.update()
            resolve();
        }, 100));
    }

    getAllLayers(map) {
        let layers = [];
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
               layers.push(layer)
            }
        });
        return layers;
    }
    
    draw() {
        if (this.isDeleted) return; // Don't draw if deleted
        //console.log('draw marker', this);
        try {
            
            if (this.marker && !this.map.hasLayer(this.marker)) {
                console.log('vai adicionar', !!this.marker , !!this.map.hasLayer(this.marker), this.marker && !this.map.hasLayer(this.marker))
                this.map.addLayer(this.marker);
    
            }

           /*  if (this.selected) {
                this.marker.openPopup();
            } else {
                this.marker?.closePopup();
            } */
            
        } catch (error) {
            console.log('search mark draw error', error, this);
        }
    }

    generatePopupContent(obj) {
        console.log('calling marker popup', obj)
        // Generate HTML content for the popup from the info object
        let header = `<strong>INFO</strong><br>`
        let html = Object.keys(obj).map(key => `<strong>${key}:</strong> ${obj[key]}`).join('<br>');
        return header + html
       
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

    getBoundingBox() {

        const lat = this.latlng[0]
        const lon = this.latlng[1]

        const distance = this._boxSize
        
        const earthRadius = 6378.1; // Radius of the Earth in kilometers
    
        const latChange = distance / earthRadius;
        const lonChange = distance / (earthRadius * Math.cos(Math.PI * lat / 180));
    
        const minLat = lat - latChange * 180 / Math.PI;
        const maxLat = lat + latChange * 180 / Math.PI;
        const minLon = lon - lonChange * 180 / Math.PI;
        const maxLon = lon + lonChange * 180 / Math.PI;
    
        return [minLat, minLon, maxLat, maxLon];
    }
}
