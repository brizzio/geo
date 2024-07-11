class Store {
    constructor(mapContext, result, options={}) {
        this.mapContext = mapContext
        this.map = this.mapContext.map;
        this.result = result;
        this.latlng = [result.lat, result.lon];
        this.marker = null;
        this.selected = false
        this.options = options

        const markHtml=`
        <span class="fa-stack fa-lg">
        <i class="fa fa-circle fa-stack-2x"></i>
        <i class="fa fa-flag fa-stack-1x fa-inverse"></i>
        </span>
        `

        this.icon = L.divIcon({
            className: 'branch-marker',
            html: markHtml,
            iconSize: [20, 20], // Size of the icon (adjust as needed)
            iconAnchor: [10, 10], // Anchor point of the icon (center in this case)
        });

         this.circle = L.circle(this.latlng, {
            color: 'purple',  // Color of the circle
            fillOpacity: 0.7,  // Opacity of the fill
            stroke: false,  // No border stroke
        });

        this.circle.setRadius(50);

         // Add custom styles if they haven't been added yet
         BranchMarker.addCustomStyles();


        // Check if marker already exists at this location
        if (!this.isMarkerAlreadyPresent()) {
            this.addMarker();
            options?.fly && this.flyToLocation();   
        }

       
    }

    static init(mapContext, data, index = 0){

        let b = new BranchMarker(mapContext, data)
        let branch = CompanyModel.parse(data)
        branch.class = 'branch'
        branch.headquarter_id = data.headquarter_id
        mapContext.state.addBranch(index, branch )
        return b

    }

    static restore(map, data){
        console.log('restore branch', data)
        let restoredData = {lat:data.geo.latlng[0], lon:data.geo.latlng[1], display_name:JSON.stringify(data)}
        return new BranchMarker(map, restoredData)

    }

    static addCustomStyles() {
        if (BranchMarker.stylesAdded) return;

        const style = document.createElement('style');
        style.id = 'branch-marker-style';
        style.innerHTML = `
           
             .branch-marker i.fa-circle {
                color: #484c4c; /*  */
                opacity: 0.5; /* Set opacity to 50% */
            }
            .branch-marker.selected i.fa-circle {
                color: green; /* Change color to green */
                opacity: 0.8; /* Set opacity to 50% */
            }
        `;
        document.getElementsByTagName('head')[0].appendChild(style);
        BranchMarker.stylesAdded = true;
    }

    

    addMarker() {
        if (this.marker) return;
        console.log('branch marker', this.result)
        this.options = {...this.options, icon:this.icon}
        this.marker = L.marker(this.latlng, this.options)
        this.marker.bindPopup(this.result.display_name);

         // Set up the custom context menu
         this.contextMenu = new ContextMenu([
            
            { id: 'select-branch', text: 'Selecionar', onClick: this.setBranch.bind(this) },
            { id: 'set-concurrent', text: 'Aicionar Concorrente', onClick: this.setConcurrent.bind(this) },
            { id: 'delete', text: 'Remover', onClick: this.remove.bind(this) }
        ]); 

        this.marker.on('contextmenu', (event) => {
            this.contextMenu.hideContextMenus();
            this.showContextMenu(event);
        });

        this.marker.on('click', () => {
            //this.map.selectedMarker = this;
            this.selected = !this.selected;
            this.contextMenu.removeContextMenu();
            this.update()
        });
        this.update()

    }

    update(){
        //perform updates
        // Change the color of the circle based on the selected state
        //this.circle.setStyle({ color: this.selected ? 'blue' : 'purple' });

        
        this.draw()
    }

    draw(){
        try {
            //Remove existing layer 
        if(this.marker) this.map.removeLayer(this.marker);
        this.map.addLayer(this.marker);

         // Add or remove the selected class to the marker icon
         const markerElement = this.marker.getElement();
         //console.log('markerElement selected', markerElement)
         if (markerElement) {
             if (this.selected) {
                 markerElement.classList.add('selected');
             } else {
                 markerElement.classList.remove('selected');
             }
         }
        
        // Add the circle to the map
         console.log('selected', this.selected)
         if(this.selected){
            //this.map.addLayer(this.circle);  // `_map` is the Leaflet map object
            this.marker.openPopup()
         }else{
            //this.map.removeLayer(this.circle);
            this.marker.closePopup()
         }
            
        } catch (error) {
            console.log('search mark draw error', error, this)
        }
        
    }

    showContextMenu(event) {
        L.DomEvent.stopPropagation(event);

        let left = `${event.containerPoint.x}px`;
        let top = `${event.containerPoint.y}px`;

        this.contextMenu.createContextMenu(top, left);

        this.marker.closePopup()
        this.map.selectedMarker = this;
    }


    setHeadquarter(){
        console.log('click on menu headquarter')
        this.selected = true
        let head = CompanyModel.parseFromSearchMarkerData(this)
        console.log('to head', head)
        Headquarter.initFromSearchMarker(this.mapContext, this.latlng, head)
        this.remove()
        this.contextMenu.removeContextMenu();
    }

    setBranch(){
        
        try {
            console.log('click on menu Branch')
            
            let hqs = this.mapContext.state.headquarters || []
            console.log('hqs', hqs)
            if (!hqs) {
                alert('insira uma companhia matriz para adicionar filiais...')
                return;
            }

            
            if(hqs.lenght==1){
                let hqId = hqs[0].company.company_id
                let branch = CompanyModel.parseFromSearchMarkerData(this)
                branch.class='branch'
                branch.headquarter_id = hqId
                this.mapContext.state.addBranch(0, branch)
            }
            const options = hqs.map(hq=>hq.company.company_name);
            this.selected = true

            this.contextMenu.removeContextMenu();
            new OptionForm(this.map, this.marker, options, (chosenOption, i) => {
                console.log('Chosen option:', chosenOption, i);
                let hqId = hqs[i].company.company_id
                let branch = CompanyModel.parseFromSearchMarkerData(this)
                branch.class='branch'
                branch.headquarter_id = hqId
                this.mapContext.state.addBranch(i, branch)

            }).show();
                
        } catch (error) {
            console.log('set branch error', error, this)
        }
        
    }

    setConcurrent(){
        console.log('click on menu Concurrent')
        this.selected = true
        this.contextMenu.removeContextMenu();
    }

    remove(){
        console.log('click on menu Remove',this.result)
        
        this.contextMenu.removeContextMenu();
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




 // Add a static property to track if styles have been added
 BranchMarker.stylesAdded = false;




