class Map {
     constructor(tenant, latlngs, state = {}) {

        if (Map.instance) {
            return Map.instance;
        }

        this.mapId = tenant;
        this.tenant = tenant
        this.latlngs = latlngs || [-23.5676567, -46.6505462]
        //this.zoom = zoom || 10
        this.selectedMarker = null;
        this.selectedPolygon = null;
        this.markers = [];
        this.areas = [];
        this.selectedItems = [];
        this.contextMenuLatLng = null;

        this.singles = new Collection('singles')
        
        this.dao = new MapTree(this.mapId)
        this.state = this.dao.tree

        if (typeof  this.map !== 'undefined' &&  this.map !== null) {
            this.map.remove(); // Remove the existing map instance
          }
        console.log('map constructor..')
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
            { id: 'add-banner', text: 'Adicionar Bandeira', onClick: this.addBanner.bind(this) },
            { id: 'add-hq', text: 'Adicionar Matriz', onClick: this.addHq.bind(this) },
            { id: 'add-hqstore', text: 'Adicionar Loja Matriz', onClick: this.addHqStore.bind(this) },
            { id: 'add-branchstore', text: 'Adicionar Loja Rede', onClick: this.addBranchStore.bind(this) },
            { id: 'add-concurrentStore', text: 'Adicionar Concorrente', onClick: this.addConcurrentStore.bind(this) },
            { id: 'add-cluster', text: 'Adicionar Cluster', onClick: this.addCluster.bind(this) },
            { id: 'add-area', text: 'Criar Area de Interesse', onClick: this.startDrawingArea.bind(this) },
            { id: 'add-marker', text: 'Adicionar Local de Estudo', onClick: this.addMarker.bind(this) },        
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
            { text: 'Clusters', onClick: () => clusters() },
            { text: '+ Bandeira', onClick: () => this.showBannerForm() },
            { text: '+ Filial', onClick: () => alert('Filial button clicked') },
            { text: '+ Concorrente', onClick: () => alert('Concorrente Button clicked') },
        ];

        this.control = new ButtonsBar(buttons, { position: 'bottomright' }, this)

        // Add the custom control to the map
        this.map.addControl(new SearchBar(this, { position: 'topleft' }));

        // Add the buttons bar control to the map
        this.map.addControl(this.control);

        
        

        // Restore map state
        this.update();

        Map.instance = this;

    }

    get layerCount(){
        return this._layerCount || 0
    }

    set layerCount(c){
        this._layerCount = c
    }

   /*  static onlayerAdd(map, event) {
        console.log('Layer added:', map ,event.layer);
        // Additional logic when a layer is added
        console.log('Layers:', getAllLayers(map));
    } */

   
    update() {
        this.map.eachLayer((layer) => {
            if (!(layer instanceof L.TileLayer)) {
                console.log('removin layer', layer)
                this.map.removeLayer(layer);
            }
        });
        let storedSearchItems = new SearchItems().data
        let tree = null

        let singles = this.singles.findBy('tenant_id', this.tenant)
        
        
        
        //console.log(storedSearchItems)
        if(storedSearchItems){
            storedSearchItems.forEach(item=> {
                //console.log('item:', item)
                let mk = new SearchMarker(this, item,{ draggable:true })
                //console.log('mk:', mk)
                //this.map.addLayer(mk.marker)
            })
        }

        if(singles){

            singles.forEach((single,i)=>{
                //console.log('restoring',i, single, single.geo.latlon)
                new SingleMarker(this, single)
            })
        }

        let headquarters = new HeadquarterModel().table.findBy('tenant_id', this.tenant)
        if(headquarters){

            headquarters.forEach((headquarter,i)=>{
                //console.log('restoring',i, headquarter, headquarter.geo.latlon)
                new HeadquarterMarker(this, headquarter)
            })
        }

        let headquarterStores = new HeadquarterStoreModel().table.findBy('tenant_id', this.tenant)
        if(headquarterStores){

            headquarterStores.forEach((headquarterStore,i)=>{
                //console.log('restoring',i, headquarterStore, headquarterStore.geo.latlon)
                new HeadquarterStoreMarker(this, headquarterStore)
            })
        }

        let branchStores = new BranchStoreModel().table.findBy('tenant_id', this.tenant)
        if(branchStores){

            branchStores.forEach((branchStore,i)=>{
                //console.log('restoring',i, branchStore, branchStore.geo.latlon)
                new BranchStoreMarker(this, branchStore)
            })
        }

        let concurrentStores = new ConcurrentStoreModel().table.findBy('tenant_id', this.tenant)
        if(concurrentStores){

            concurrentStores.forEach((concurrentStore,i)=>{
                //console.log('restoring',i, concurrentStore, concurrentStore.geo.latlon)
                new ConcurrentStoreMarker(this, concurrentStore)
            })
        }

        this.layerCount = this.getAllLayers().length
        this.control.updateCounter(this.layerCount)
        console.log('map updated layers' , this.layerCount)



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

    

    addMarker() {
        
        let m = Single.init( this.tenant , this.contextMenuLatLng)
        console.log(m.data, this.mapId)
    
        this.singles.create(m.data)
        
        console.log('singles', this.singles)

        this.update()
        //MarkerNew.init(this, this.contextMenuLatLng)
        this.contextMenu.hideContextMenus()
        //this.saveMapState();
       
    }

    async addBanner(){
        let b = new BannerModel()
        console.log('vai adicionar banner', b)
        b.tenant = this.tenant
        b.generateId()

        const onUpdate = async (d) => {
            try {
                // Let's geo locate the entered address
                // Create an address object from form address entries
                console.log('formData', d);
               
                 // Merge geolocation address data with original form data address
                 let updated = new BannerModel(d)
                 console.log('before save headquarter data', updated.data);
 
                 // Save the data
                 updated.table.create(updated.data);


            } catch (error) {
                console.log('onUpdate error', error);
            }
        }

        b.showEditForm('Nova Bandeira', onUpdate)
        this.contextMenu.hideContextMenus()
    }

    async addHq(){
     
        let h = new HeadquarterModel()
        console.log('vai adicionar matriz', h)
        h.tenant = this.tenant
        h.generateId()
        
        const onUpdate = async (d) => {
            try {
                // Let's geo locate the entered address
                // Create an address object from form address entries
                console.log('formData', d);
                let add = new AddressModel(d.address);
                console.log('onUpdate', add);
                let query = add.query || 'Av. Paulista 900, sao paulo, sp'
                // Await the geolocation result
                const result = await SearchResultModel.geolocateByAddressString(query);
                console.log('hq geolocation', result); // This will log the result

                // Merge geolocation address data with original form data address
                let nhq = new HeadquarterModel(d).mergeSearchResult(result)
                console.log('before save headquarter data', nhq.formData);

                // Save the headquarter data
                nhq.table.create(nhq.formData);

                // show new marker
                new HeadquarterMarker(this, nhq.formData)


            } catch (error) {
                console.log('onUpdate error', error);
            }
        }
        
        h.showEditForm('Nova Matriz', onUpdate)
        this.contextMenu.hideContextMenus()
    }

    addHqStore(){
        let instance = new HeadquarterStoreModel()
        console.log('vai adicionar loja matriz', instance)
        instance.tenant = this.tenant
        instance.generateId()
        
        const onUpdate = async (d) => {
            try {
                // Let's geo locate the entered address
                // Create an address object from form address entries
                console.log('formData', d);
                let add = new AddressModel(d.address);
                console.log('onUpdate', add);
                let query = add.query || 'Al. Santos 734, sao paulo, sp'
                // Await the geolocation result
                const result = await SearchResultModel.geolocateByAddressString(query);
                console.log('hq geolocation', result); // This will log the result

                // Merge geolocation address data with original form data address
                let updated = new HeadquarterStoreModel(d).mergeSearchResult(result)
                console.log('before save headquarter data', updated.formData);

                // Save the headquarter data
                updated.table.create(updated.formData);

                // show new marker
                new HeadquarterStoreMarker(this, updated.formData)


            } catch (error) {
                console.log('onUpdate error', error);
            }
        }
        
        instance.showEditForm('Nova Loja Matriz', onUpdate)
        this.contextMenu.hideContextMenus()
    }

    addBranchStore(){
        console.log('vai adicionar loja na rede')
        let instance = new BranchStoreModel()
        console.log('vai adicionar loja de rede', instance)
        instance.tenant = this.tenant
        instance.generateId()

        const onUpdate = async (d) => {
            try {
                // Let's geo locate the entered address
                // Create an address object from form address entries
                console.log('formData', d);
                let add = new AddressModel(d.address);
                console.log('onUpdate', add);
                let query = add.query || 'Al. Jau 1744, sao paulo, sp'
                // Await the geolocation result
                const result = await SearchResultModel.geolocateByAddressString(query);
                console.log('hq geolocation', result); // This will log the result

                // Merge geolocation address data with original form data address
                let updated = new BranchStoreModel(d).mergeSearchResult(result)
                console.log('before save branch store data', updated.formData);

                //update icon color: 
                updated.geo.activated_marker_color = updated.parentData.geo.activated_marker_color

                // Save the headquarter data
                updated.table.create(updated.formData);

                // show new marker
                new BranchStoreMarker(this, updated.formData)


            } catch (error) {
                console.log('onUpdate error', error);
            }
        }
        
        instance.showEditForm('Nova Loja de Rede', onUpdate)

        this.contextMenu.hideContextMenus()
    }

    addConcurrentStore(){
        
        let instance = new ConcurrentStoreModel()
        console.log('vai adicionar ConcurrentStore', instance)
        instance.tenant = this.tenant
        instance.generateId()
        instance.showEditForm('Cadastro de Concorrente', instance.onCreate, this)

        this.contextMenu.hideContextMenus()
    }

    addCluster(){
        let instance = new ClusterModel()
        console.log('vai adicionar Cluster', instance)
        instance.tenant = this.tenant
        instance.generateId()

        const onUpdate = async (d) => {
            try {
                // Let's geo locate the entered address
                // Create an address object from form address entries
                console.log('formData', d);
                
                let updated = new ClusterModel(d)
                console.log('before save cluster data', updated.data);

                // Save the cluster data
                updated.table.create(updated.data);

               alert('cluster criado com sucesso!')


            } catch (error) {
                console.log('Cluster onUpdate error', error);
            }
        }
        
        instance.showEditForm('Novo Cluster', onUpdate)

        this.contextMenu.hideContextMenus()
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
                console.log('removin layer', layer)
                this.map.removeLayer(layer);
            }
        });
    }

    getAllLayers() {
        let layers = [];
        this.map.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
               layers.push(layer)
            }
        });
        return layers;
    }

    
}

