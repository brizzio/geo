class SearchMarker {
    constructor(mapContext, result, options={}) {
        this.mapContext = mapContext
        this.map = this.mapContext.map;
        this.result = result;
        this.latlng = [result.lat, result.lon];
        this.marker = null;
        this.selected = false
        this.visited = result.visited || false
        

        const str = `${this.result.name}::${this.result.store_type || this.result.address_type}`
        this.icon = new SearchMarkIcon(str);
       
        this.options = Object.assign(options,{
            icon: this.icon.element
        })

        this.popup_content = new AddressModel(this.result.address).html

         this.circle = L.circle(this.latlng, {
            color: 'purple',  // Color of the circle
            fillOpacity: 0.7,  // Opacity of the fill
            stroke: false,  // No border stroke
        });

        this.circle.setRadius(50);

         // Add custom styles if they haven't been added yet
         //SearchMarker.addCustomStyles();


        // Check if marker already exists at this location
        if (!this.isMarkerAlreadyPresent()) {
            this.addMarker();
            this.flyToLocation();   
        }

        this.mapContext.map.on('zoomend', this.update.bind(this));
    }

   /*  static addCustomStyles() {
        if (SearchMarker.stylesAdded) return;

        const style = document.createElement('style');
        style.id = 'search-marker-style';
        style.innerHTML = `
           
            .podcast i {
                color: #484c4c; 
                opacity: 0.5; // Set opacity to 50% 
            }
            .podcast.selected i {
                color: green; // Change color to green 
                opacity: 0.8; // Set opacity to 50% 
            }
        `;
        document.getElementsByTagName('head')[0].appendChild(style);
        SearchMarker.stylesAdded = true;
    }
 */
    

    addMarker() {
        if (this.marker) return;
        console.log('search marker', this.result)

        //this.options = {...this.options, icon:this.icon}
        this.marker = L.marker(this.latlng, this.options)
        this.marker.bindPopup(this.popup_content);

         // Set up the custom context menu
         this.contextMenu = new ContextMenu([
            { id: 'set-headquarter', text: 'Matriz', onClick: this.setHeadquarter.bind(this) },
            { id: 'set-head-store', text: 'Loja Matriz', onClick: this.setHeadStore.bind(this) },
            { id: 'set-branch', text: 'Filial', onClick: this.setBranch.bind(this) },
            { id: 'set-concurrent', text: 'Concorrente', onClick: this.setConcurrent.bind(this) },
            { id: 'delete', text: 'Remover', onClick: this.remove.bind(this) }
        ]); 

        this.marker.on('contextmenu', (event) => {
            this.contextMenu.hideContextMenus();
            this.showContextMenu(event);
        });

        this.marker.on('click', () => {
            //this.map.selectedMarker = this;
            this.selected = !this.selected;
            this.visited = true
            console.log('clicked', this)
            new SearchItems().setVisited(this.result.place_id)
            this.contextMenu.removeContextMenu();
            this.update()
        });

        
        this.update()

    }



    update(){
        //perform updates
        // Change the color of the circle based on the selected state
        //this.circle.setStyle({ color: this.selected ? 'blue' : 'purple' });
        this.icon.setSelected(this.selected, this.visited);
        this.icon.updateVisibility(this.mapContext.map);
        this.draw()
    }

    draw(){
        try {
            //Remove existing layer 
        if(this.marker) this.map.removeLayer(this.marker);
        
        // Update the icon
            this.marker.setIcon(this.icon.element);
        
        this.map.addLayer(this.marker);

        // Add the circle to the map or open popup
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

    generatePopupContent() {
        console.log('calling store marker popup', this.info)
        // Generate HTML content for the popup from the info object
        let header = `<strong>Store Id:</strong> ${this.id}<br><strong>Store Name:</strong> ${this.name}<br>`
        let data = Object.keys(this.info).map(tag => `<strong>${tag}:</strong> ${this.info[tag]}`).join('<br>');
        return header + data
    }

    showContextMenu(event) {
        L.DomEvent.stopPropagation(event);

        let left = `${event.containerPoint.x}px`;
        let top = `${event.containerPoint.y}px`;

        this.contextMenu.createContextMenu(top, left);

        this.marker.closePopup()
        this.map.selectedMarker = this;
    }


    async setHeadquarter() {
        console.log('click on menu headquarter');
        this.selected = true;
        this.contextMenu.removeContextMenu();
        
        let head = CompanyModel.parseFromSearchMarkerData(this);
        
        console.log('Selected head:', head);
        Headquarter.initFromSearchMarker(this.mapContext, this.latlng, head);
        this.remove();
        
    }

    async setHeadStore() {
        console.log('click on menu headquarter');
        this.selected = true;
        this.contextMenu.removeContextMenu();
        console.log('banners', this.mapContext);
        const banners = this.mapContext.state.banners
        console.log('banners', banners, banners.length);
        if(!banners.length){
            alert('Inerir uma bandeira antes de adicionar uma matriz')
            await showPopupBannerForm(this.mapContext, this.marker)
            
        }
        let head = CompanyModel.parseFromSearchMarkerData(this);

        if(banners.length == 1){
           head.banner = banners[0]
        }

        if(banners.length > 1){
            const options = banners.map(banner=>banner.name);
            console.log('Awaiting option form...');
            let optionIndex = await showOptionFormAndWait(this.map, this.marker, options);
            head.banner = banners[optionIndex]
         }
        
        
        
        console.log('Selected head:', head);
        //Headquarter.initFromSearchMarker(this.mapContext, this.latlng, head);
        //this.remove();
        
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

            let branchData = this.result
            this.contextMenu.removeContextMenu();
            
            if(hqs.lenght==1){
                let hqId = hqs[0].company.company_id
                branchData.headquarter_id = hqId
                BranchMarker.init(this.mapContext, branchData)
            }else{

                const options = hqs.map(hq=>hq.company.company_name);
                new OptionForm(this.map, this.marker, options, (chosenOption, i) => {
                    console.log('Chosen option:', chosenOption, i);
                    let hqId = hqs[i].company.company_id
                    branchData.headquarter_id = hqId
                    BranchMarker.init(this.mapContext, branchData, i)
                }).show();

            this.remove()

            }
            
                
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
        searchStore.deleteObjectFromArray('osm_id',this.result.osm_id)
        this.map.removeLayer(this.marker);
        this.map.removeLayer(this.circle);
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
        //console.log('checking', markerAlreadyPresent)
        return markerAlreadyPresent;
    }

    flyToLocation() {
        this.map.flyTo(this.latlng, 14, {
            duration: 2 // Duration in seconds
        });
    }
}



 // Add a static property to track if styles have been added
// SearchMarker.stylesAdded = false;

 async function selectBanner(mctx, marker){
    try {
        console.log('click on menu Branch')
        
        let banners = mctx.state.banners || []
        console.log('banners', banners)
        if (!banners) {
            alert('insira uma bandeira antes de continuar...')
            return null;
        }

        
        if(banners.lenght==1){
            return banners[0]
        }else{

            const options = banners.map(banner=>banner.name);
            return new OptionForm(mctx.map, marker, options, (chosenOption, i) => {
                console.log('Chosen option:', chosenOption, i);
                return chosenOption
            }).show();

        

        }
            
    } catch (error) {
        console.log('set banner error', error)
    }
 }

 async function showOptionFormAndWait(map, marker, options) {
    console.log('show option called', options);
    return new Promise((resolve, reject) => {
        const optionForm = new OptionFormAsync(options, resolve);
        console.log('Option form instance created');
        optionForm.show(marker.getLatLng(), map);
        console.log('Option form show method called');
    });
}


class OptionFormAsync {
    constructor(options, resolve) {
        this.options = options;
        this.resolve = resolve;
        this.form = null;
        this.popup = null;
        console.log('OptionFormAsync created with options:', options);
    }

    show(latlng, map) {
        console.log('Showing form at latlng:', latlng);
        this.popup = L.popup()
            .setLatLng(latlng)
            .setContent(this.createForm())
            .openOn(map);

        console.log('Popup added to map');

        // Prevent clicks outside the form
        setTimeout(() => {
            const handleClickOutside = (event) => {
                if (this.form && !this.form.contains(event.target)) {
                    console.log('Clicked outside form');
                    this.resolve(null);
                    this.hide();
                    document.removeEventListener('click', handleClickOutside);
                }
            };

            document.addEventListener('click', handleClickOutside);
        }, 100); // Introduce a 100ms delay before adding the click listener
    }

    createForm() {
        console.log('Creating form with options:', this.options);
        const form = document.createElement('div');
        form.className = 'option-form';
        // Set styles directly using the style property
        form.style.background = 'white';
        form.style.border = '1px solid #ccc';
        form.style.padding = '10px';
        form.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        form.style.zIndex = '1001';

        this.options.forEach((option, i) => {
            const button = document.createElement('button');

            // Set styles directly using the style property
            button.style.display = 'block';
            button.style.marginBottom = '5px';
            button.style.padding = '5px';
            button.style.width = '100%';
            button.style.boxSizing = 'border-box';
            
            button.innerText = option;
            button.addEventListener('click', () => {
                console.log('Option selected:', option);
                this.resolve(i);
                this.hide(option);
            });
            form.appendChild(button);
        });

        this.form = form;
        return form;
    }

    hide(value=null) {
        console.log('Hiding form', value);
        if(!value) return;
        if (this.popup) {
            this.popup._map.closePopup(this.popup); // Close the popup using the map instance
        }
        if (this.form) {
            this.form.remove();
        }
    }
}

const showPopupBannerForm = async (mapctx, marker) => {
    console.log('Add Banner Button clicked');
    let latlng = marker.getLatLng()
    let map = mapctx.map
    const banner = new BannerModel()
    
    const inputs = banner.formInputs
    console.log('inputs:', inputs);
    const onSave = (formData) => {
        console.log('Form Data:', formData);
        let newBanner = banner.createFromFormData(formData)
        console.log('banner instance',newBanner.data);
        mapctx.dao.addBanner(newBanner.data)
    };

    const onCancel = () => {
        console.log('Form cancelled');
    };
    const form = new PopupDynamicForm(inputs, onSave, onCancel);
     // Show form asynchronously and wait for completion
     await new Promise((resolve, reject) => {
        form.show(latlng, map);
        form.onClose = resolve; // Resolve the promise when form is closed
    });

    console.log('Form rendered');
}; 
