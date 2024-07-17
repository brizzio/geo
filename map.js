class Map {
     constructor(mapId, latlngs, state = {}) {
        this.mapId = mapId;
        this.latlngs = latlngs || [-23.5676567, -46.6505462]
        //this.zoom = zoom || 10
        this.selectedMarker = null;
        this.selectedPolygon = null;
        this.markers = [];
        this.areas = [];
        this.selectedItems = [];
        this.contextMenuLatLng = null;
        
        this.dao = new MapTree(this.mapId)
        this.state = this.dao.tree

        this.map = L.map('map', {
            zoomControl: false // Disable the default zoom control
        }).setView(this.latlngs,10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© Fabrizio Salvade'
        }).addTo(this.map);

        // Listen for the layeradd event
        // Listen for the layeradd event
        //this.map.on('layeradd', (e)=>console.log(e));

        this.contextMenu = new ContextMenu([
            { id: 'add-marker', text: 'Add Marker', onClick: this.addMarker.bind(this) },
            { id: 'add-area', text: 'Add Area', onClick: this.startDrawingArea.bind(this) },        
        ]);

        this.map.on('contextmenu', (event) => {
            this.contextMenuLatLng = event.latlng;
            this.contextMenu.hideContextMenus();
            this.showContextMenu(event)
        });

        this.map.on('click', () => this.contextMenu.hideContextMenus());

       
      
        /* // Leaflet Draw Control
        this.drawControl = new L.Control.Draw({
            draw: {
                marker: false,
                polyline: false,
                circle: false,
                rectangle: false,
                circlemarker: false
            }
        });
        this.map.addControl(this.drawControl); */

        this.map.on(L.Draw.Event.CREATED, (event) => this.addArea(event));
        this.map.on(L.Draw.Event.EDITED, () => console.log('edited fired'));

        // Define buttons and actions
        const buttons = [
            { text: '+ Matriz', onClick: () => this.showHeadquarterForm() },
            { text: '+ Bandeira', onClick: () => this.showBannerForm() },
            { text: '+ Filial', onClick: () => alert('Filial button clicked') },
            { text: '+ Concorrente', onClick: () => alert('Concorrente Button clicked') },
        ];

        // Add the custom control to the map
       this.map.addControl(new SearchBar(this, { position: 'topleft' }));

        // Add the buttons bar control to the map
        this.map.addControl(new ButtonsBar(buttons, { position: 'bottomright' }));

        

        // Restore map state
        this.update();


    }


   /*  static onlayerAdd(map, event) {
        console.log('Layer added:', map ,event.layer);
        // Additional logic when a layer is added
        console.log('Layers:', getAllLayers(map));
    } */

   

    

    update() {
        this.clearMap()
        let storedSearchItems = new SearchItems().data
        let tree = this.state

        //console.log(storedSearchItems)
        if(storedSearchItems){
            storedSearchItems.forEach(item=> {
                //console.log('item:', item)
                let mk = new SearchMarker(this, item,{ draggable:true })
                //console.log('mk:', mk)
                //this.map.addLayer(mk.marker)
            })
        }

        console.log('no update tree' , tree)

        if(!tree) return;
        
            tree.headquarters && tree.headquarters.forEach(headquarter=> {
                console.log('headquarter:', headquarter)
                let latlng = headquarter.geo.latlon
                new Headquarter(this, latlng, headquarter)
                //restore headquarter branches if any
                /* let branches = headquarter.branches
                if(branches.length){
                    branches.forEach(branch=>{
                        console.log('restoring branch:', branch)
                        let b = BranchMarker.restore(this, branch)
                    })
                } */
                //console.log('mk:', mk)
                //this.map.addLayer(mk.marker)
            })
        

       /*  const savedMapState = JSON.parse(localStorage.getItem(this.mapId));

        if (savedMapState) {
            this.clearMap()
            if (savedMapState.headquarters) {
                savedMapState.headquarters.forEach(headquarter => new Headquarter(
                    this, 
                    headquarter.latlngs,
                    headquarter.id,
                    headquarter.company_name,
                    headquarter.company_address,
                    headquarter.company_type,
                    headquarter.boundingBox 
                ))
            }
             /* if (savedMapState.areas) {
                savedMapState.areas.forEach(areaData => {
                    const {latlngs, id, name, options, showBoundingBox, stores } = areaData
                    const restoredLayer = L.geoJSON(areaData.geojson).getLayers()[0];
                    const restoredArea = new Polygon(this,latlngs, id, name, options, showBoundingBox, stores);
                    this.areas.push(restoredArea);
                    //this.map.addLayer(restoredLayer);
                }); 
            } */
        
        //}  
        //*/
    }

    showContextMenu(event) {
        L.DomEvent.preventDefault(event);
        L.DomEvent.stopPropagation(event);
        let left = `${event.containerPoint.x}px`;
        let top = `${event.containerPoint.y}px`;
        this.contextMenu.createContextMenu(top, left);
    }


    showHeadquarterForm = () => {
        console.log('Button clicked');
        let hq = new HeadquarterModel()
        hq.language='pt-BR'
                
        const onSave = async(formData) => {
            console.log('Form Data:', formData);
            let response = await this.addHeadquarter(formData);
            console.log('response', response)
            this.dao.addHeadquarter(response)
        };

        const onCancel = () => {
            console.log('Form cancelled');
        };
        
        hq.showControlButtonForm(onSave);
        
        console.log('Form rendered');
    }; 


    showBannerForm = () => {
        console.log('Add Banner Button clicked');
        const banner = new BannerModel()
        
        const inputs = banner.formInputs
        
        const onSave = (formData) => {
            console.log('Form Data:', formData);
            let newBanner = banner.createFromFormData(formData)
            console.log('banner instance',newBanner.data);
            this.dao.addBanner(newBanner.data)
        };

        const onCancel = () => {
            console.log('Form cancelled');
        };
        const form = new DynamicForm(onSave, onCancel);
        form.show(inputs);
        console.log('Form rendered');
    }; 

    /* addMarker() {
    
        const newMarker = new Marker(this, this.contextMenuLatLng);
        this.markers.push(newMarker);
        this.contextMenu.removeContextMenu();
        newMarker.draw()
        //this.saveMapState();
        
    } */

        addMarker() {
    
            const newMarker = new MarkerNew(this, this.contextMenuLatLng)
            newMarker.draw()
            this.contextMenu.hideContextMenus()
            //this.saveMapState();
            
        }

    
    
    
    
    async addHeadquarter(formData) {
       
       console.log('addHeadquarter formaData', formData) 

       let formDataAddress=formData.address
       const address = formDataAddress.street
       ?`${formDataAddress.street_number}, ${formDataAddress.street}, ${formDataAddress.city}, ${formDataAddress.state}`
       :'900, av. paulista, São Paulo, SP' 

       console.log('locate this', address)

       try {
            const result = await new SearchResultModel().geolocateByAddressString(address);
            console.log(result); // This will log the result
            // You can also use the result here
            //const newMarker = Headquarter.init(this,latlngs,result,formData);
            let headquarter= new HeadquarterModel().parseFromSearchItemData(result)
            console.log('parsedResultToCompanyModel', headquarter.data);
            headquarter.update(formData)
            let updatedAddress= new AddressModel(result.address)
            updatedAddress.update(formData.address)
            console.log('updatedAddress', updatedAddress);
            headquarter.updateAddress = updatedAddress.data
            console.log('hqData', headquarter.data);
            return headquarter;
        } catch (error) {
            console.error(error);
        }

       
        
    }

    async getLatLongFromAddress(address) {
       
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1`;
    
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data.length > 0) {
                console.log('data:',data)
                const { lat, lon } = data[0];
                return { ...data[0], lat: parseFloat(lat), lon: parseFloat(lon) };
            } else {
                throw new Error('No results found');
            }
        } catch (error) {
            console.error('Error fetching the geocoding data:', error);
            return null;
        }
    }


    startDrawingArea() {
        new L.Draw.Polygon(this.map).enable();
        this.contextMenu.removeContextMenu();
        
    }

    addArea(event) {
        const layer = event.layer;
        let latlngs = layer.getLatLngs()[0]
        let id = Math.round(Math.random()*1000 + 1)
        const newArea = new Polygon(this, latlngs, id);
        this.areas.push(newArea);
        this.updateMapState()

    }

    updateMapState(){
        console.log('markers:',this.markers)
        const markersState = this.markers.map(marker => ({
            id:marker.id,
            name:marker.name,
            latlng: marker.latlng,
            options: marker.options,
            info:marker.info,
            type:marker.type
        }));
        console.log('areas:',this.areas)
        //geojson: area.layer.toGeoJSON(),
        const areasState = this.areas.map(area => {
            console.log('area:',area, area.layerData)
            return{
            id:area.id,
            name:area.name,
            latlngs:area.latlngs,
            options:area.options,
            showBoundingBox:area.showBoundingBox,
            stores:area.stores
        }});
        localStorage.setItem(this.mapId, JSON.stringify({ markers: markersState, areas: areasState }))

    }

    save() {
        if (this.selectedPolygon) {
            console.log('saving', this.selectedPolygon)
            this.selectedPolygon=null;
            this.saveMapState()
            //this.remo();
             // Restore map state
            this.restoreMapState();
        }
    }


    saveMapState() {
        const markersState = this.markers.map(marker => ({
            latlng: marker.latlng,
            options: marker.options
        }));
        console.log('areas:',this.areas)
        const areasState = this.areas.map(area => {
            console.log('area:',area, area.layerData)
            return{
            id:area.id,
            geojson: area.layer.toGeoJSON(),
            ...area.layerData
        }});
        localStorage.setItem(this.mapId, JSON.stringify({ markers: markersState, areas: areasState }));
        //this.restoreMapState()
    }

    /* restoreMapState() {
        
        const savedMapState = JSON.parse(localStorage.getItem(this.mapId));
        if (savedMapState) {
            this.clearMap()
            if (savedMapState.markers) {
                savedMapState.markers.forEach(markerData => {
                    const restoredMarker = new Marker(
                        this, 
                        markerData.latlng,
                        markerData.id, 
                        markerData.name,
                        markerData.options,
                        markerData.info,
                    );
                    this.markers.push(restoredMarker);
                    //this.map.addLayer(restoredMarker);
                });
            }
             if (savedMapState.areas) {
                savedMapState.areas.forEach(areaData => {
                    const {latlngs, id, name, options, showBoundingBox, stores } = areaData
                    const restoredLayer = L.geoJSON(areaData.geojson).getLayers()[0];
                    const restoredArea = new Polygon(this,latlngs, id, name, options, showBoundingBox, stores);
                    this.areas.push(restoredArea);
                    //this.map.addLayer(restoredLayer);
                }); 
            }
        
    }  
}*/


    removeMarkerFromState(markerToRemove) {
        this.markers = this.markers.filter(marker => marker !== markerToRemove);
    }

    removePolygonFromState(polygonToRemove) {
        this.areas = this.areas.filter(area => area !== polygonToRemove);
    }

   
    clearMap() {
        this.map.eachLayer((layer) => {
            if (!(layer instanceof L.TileLayer)) {
                this.map.removeLayer(layer);
            }
        });
    }

    

    
}

function getAllLayers(map) {
    let layers = [];
    map.eachLayer(function(layer) {
        layers.push(layer);
    });
    return layers;
}