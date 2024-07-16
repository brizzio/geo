class Headquarter extends Marker {
    constructor(
        mapContext, 
        latlng,
        data 
    ) {

        // Ensure to call the parent constructor first
        super(mapContext, latlng);
        
        this.storage = mapContext.dao.storage
        // Initialize specific properties for Headquarter
        this.type = 'headquarter';
        this.info = data || {}

        this.boundingBox= this.#getBoundingBox(latlng, 80)

        
        
         // Set up the custom context menu
         this.contextMenu = new ContextMenu([
            { id: 'edit-headquarter', text: 'Editar', onClick: this.editHeadquarter.bind(this) },
            { id: 'add-branch', text: 'Inserir Filial', onClick: this.addBranch.bind(this) },
            { id: 'select-headquarter', text: 'Selecionar', onClick: this.selectHeadquarter.bind(this) },
            { id: 'add-concurrent', text: 'Inserir Concorrente', onClick: this.addConcurrent.bind(this) }
        ]); 

        this.icon = new Icon(this.info.company_name, 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png');
       
        this.options = {
            icon: this.icon.element
        }

        this.popupContent = this.generatePopupContent(this.objectify());

        this.updateMarkerVisibility();
        
        // handle the visibility of the icon.
        this.mapContext.map.on('zoomend', this.updateMarkerVisibility.bind(this));
        
        this.draw()
       
    }
   
    static init(map,latlngs, searchData, formData){
        
        console.log('init headquarter', searchData, formData)
        
        let id = searchData.osm_id || null
        let company_name = searchData.name
        //update the name with form data if any
        if(formData.name) company_name = formData.name
        let company_address = searchData.display_name
        let company_type = searchData.type
        let bb = searchData.boundingbox
        
        let h =  new Headquarter(
            map, 
            latlngs, 
            id,
            company_name,
            company_address,
            company_type,
            bb,
            searchData
        )

        h.popupContent = h.generatePopupContent(searchData);
        h.updateMapState()
        
        return h

    }

    static initFromSearchMarker(mapContext, latlngs, info){
        
        console.log('init headquarter from search result',  info)
        
        let h =  new Headquarter(
            mapContext, 
            latlngs, 
            info
        )

        mapContext.state.addHeadquarter(info)
        return h

    }

    static restore(map, data){
        console.log('restore headquarter', data)
        return new Headquarter(map, data.latlng, data)

    }

    updateMarkerVisibility() {
        //console.log('Updating marker visibility');
        this.icon.updateVisibility(this.mapContext.map);
        this.marker.setIcon(this.icon.element); // Update the marker's icon to reflect visibility changes
        //this.draw()
    }

    objectify(){
        console.log('objectify headquarter')
        return {
            ...this.info
        }
    }

    updateMapState(){
        let saved = JSON.parse(localStorage.getItem(this.mapContext.mapId))
        let state = saved ? saved : {headquarters:[]}
       

        let updatedHeadquarter = {
            id:this.id,  
            company_name:this.company_name, 
            company_type:this.company_type,
            company_address:this.company_address,
            boundingBox:this.boundingBox, 
            latlngs:this.latlng,
        }
        
        const index = state.headquarters?.findIndex(object => object.id === this.id);

        if (index >= 0){
            
            state.headquarters[index] = updatedHeadquarter
            
        }else{
            
            state.headquarters?.push(updatedHeadquarter)
        }
        
        localStorage.setItem(this.mapContext.mapId, JSON.stringify(state))
    }

    //buttons
    // Add event listener to the edit-marker list item
    editHeadquarter(){
        console.log('Edit Headquarter clicked');
        //this.showEditForm(); // Show the edit form when edit-marker is clicked
        // Remove menu
        this.contextMenu.removeContextMenu();
        let editable = new HeadquarterModel(this.info)
        console.log('editable', editable)

        const onUpdate = async(formData) => {
            console.log('Form Data:', formData, this.storage);
            //let response = await this.addHeadquarter(formData);
            this.storage.updateItemById('headquarters', formData.id, formData)
            console.log('response', formData)
            //this.dao.addHeadquarter(response)
        };

        editable.showEditForm(onUpdate)
        
     }

     addBranch(){
        console.log('Add branch clicked');
        //this.showEditForm(); // Show the edit form when edit-marker is clicked
        // Remove menu
       
        this.contextMenu.removeContextMenu();
     }


     deleteHeadquarter(){
        console.log('Delete Headquarter clicked');
        //this.mapContext.map.removeLayer(this.marker);
        //this.mapContext.removeMarkerFromState(this);
        //this.mapContext.saveMapState();
        // Remove menu
        this.contextMenu.removeContextMenu();
    };

     // Add event listener to the select-marker list item
    selectHeadquarter(){
        console.log('Select Headquarter clicked');
        //this.mapContext.selectedMarker = this;
        console.log('selected Headquarter', this)
        console.log('selected Headquarter Object', this.objectify())
         // Remove menu
         this.contextMenu.removeContextMenu();
    };

    addConcurrent(){
        console.log('add concurrent clicked');
        //this.mapContext.map.removeLayer(this.marker);
        //this.mapContext.removeMarkerFromState(this);
        //this.mapContext.saveMapState();
        // Remove menu
        this.contextMenu.removeContextMenu();
    };
    
    generatePopupContent(obj) {
        console.log('calling marker popup', obj)
        // Generate HTML content for the popup from the info object
        let header = `<strong>INFO</strong><br>`
        let html = Object.keys(obj).map(key => `<strong>${key}:</strong> ${obj[key]}`).join('<br>');
        return header + html
       
    }

   /*  generatePopupContent() {
        console.log('calling store marker popup', this.info)
        // Generate HTML content for the popup from the info object
        let header = `<strong>Store Id:</strong> ${this.id}<br><strong>Store Name:</strong> ${this.name}<br>`
        let data = Object.keys(this.info).map(tag => `<strong>${tag}:</strong> ${this.info[tag]}`).join('<br>');
        return header + data
    } */

    #getBoundingBox(latlon, distance) {

            const lat = latlon[0]
            const lon = latlon[1]
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