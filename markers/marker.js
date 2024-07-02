class Marker {
    constructor(mapContext, latlng) {
        this.mapContext = mapContext;
        this.latlng = latlng || null;
       
        

        this.popupContent= 'popup content';


        console.log('creating marker', !this.latlng, this.latlng)

        this.marker = L.marker(this.latlng, this.options)
       
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

        this.mapContext.contextMenuLatLng = event.latlng;
        this.mapContext.selectedMarker = this;
    }

     // Add event listener to the edit-marker list item
     editMarker(){
        console.log('Edit marker clicked');
        this.showEditForm(); // Show the edit form when edit-marker is clicked
        // Remove menu
        this.contextMenu.removeContextMenu();
     }

    // Add event listener to the delete-marker list item
    deleteMarker(){
        console.log('Delete marker clicked');
        this.remove();
        // Remove menu
        this.contextMenu.removeContextMenu();
    };

    // Add event listener to the select-marker list item
    selectMarker(){
        console.log('Select marker clicked');
        this.mapContext.selectedMarker = this;
        console.log('selectedMarker', this)
        console.log('selectedMarkerObject', this.objectify())
         // Remove menu
         this.contextMenu.removeContextMenu();
    };


    objectify(){
        const plainObject = {};

        for (const key in this) {
            if (this.hasOwnProperty(key)) {
                plainObject[key] = this[key];
            }
        }

        const keysToDelete = ['mapContext','contextMenu', 'iconUrl', 'marker', 'popupContent'];

        // Delete keys
        keysToDelete.forEach(key => delete plainObject[key]);
    

    return plainObject;
    }


    

    draw() {

        console.log('drasw marker', !this.marker, this)
        if(!this.marker) return 

         // Create a popup with options
         const popupOptions = {
            autoPan: true,
            offset: L.point(0, -16), // Adjust the value to move the popup above the marker
            autoPanPaddingTopLeft: L.point(0, 50)
        };

        // Bind popup to the marker
       
        this.marker.bindPopup(this.popupContent, popupOptions);

        //if(this.marker) this.mapContext.map.removeLayer(this.marker);
        
        this.marker.addTo(this.mapContext.map);

        
    }

    
    showEditForm() {
        const editForm = new EditForm(
            (name) => {
                this.updateName(name);
            },
            () => {
                console.log('Edit form canceled');
            }
        );

        editForm.show(this.name);
    }

    updateName(name) {
        this.data.name = name;
        this.generatePopupContent();
        this.draw();
        this.mapContext.updateMapState();
    }
   


    remove() {
        this.mapContext.map.removeLayer(this.marker);
        this.mapContext.removeMarkerFromState(this);
        this.mapContext.saveMapState();
    }

}
