class BranchStoreMarker extends MarkerNew {
    constructor(mapContext, data, options={}){
        super(mapContext, options)
        this._model = new BranchStoreModel()
        this._data = this._model.parse(data)
        
        this.latlng = this._data.geo.latlon

        this.name = this._data.name || '';
        this.description = this._data.description || '';

        this.title = this.name
            ? this.titleBuilder(this.name, this.description)
            : 'novo marcador';

        this.menus = [
            { id: 'edit', text: 'Editar', onClick: this.edit.bind(this) },
            { id: 'delete', text: 'Desfazer', onClick: this.deleteMarker.bind(this) }
        ];

        this.color= this._data.geo.activated_marker_color || 'red'
        this.face = 'fa-flag'
        this.fly = true

        
        
        
        this.selected = this._data.geo.selected?this._data.geo.selected: false
        this.visited = this._data.geo.visited?this._data.geo.visited:false
        console.log('constructor', this.selected, this.visited, this._model, this._data )
        
    
        this.addMarker()
    
    }

    titleBuilder(name, description){
        let div = document.createElement('div')
        div.style.cssText=`
            display: flex;
            flex-direction: column;
            margin-left: 20px;
            align-items: center;
        `

        let nm = document.createElement('span')
        nm.innerHTML=name
        let d = document.createElement('span')
        d.innerHTML=description

        div.appendChild(nm)
        div.appendChild(d)

        return div.outerHTML
    }

    deleteMarker(){
        
        this.mapContext.map.removeLayer(this.marker);
        this.isDeleted = true
        this._model.table.remove(this._data.id)
        console.log('deleting this', this, this._data.id)
        this.contextMenu.removeContextMenu();

        // Remove marker from store
        //delete this.mapContext.markerStore[this.id];
       
    }

    async edit(){
        console.log('edit this', this, this._data.id)
        
            const id = this._data.id
            this.visited = true

            //update data with marker selections and other actions
            await this.geoUpdate(false, true)

            const onUpdate = async (d) => {
                console.log('before save form data', d)
                this._model.table.update(id, d)

                // Update instance properties
                this.name = d.name;
                this.description = d.description;
                this.title = this.name && this.description
                    ? this.titleBuilder(this.name, this.description)
                    : 'novo marcador';
                // Update marker icon title
                this.icon.setTitle(this.title);
                let color = d.geo.activated_marker_color || null
                this.icon.setActiveColor(color);
                this.update();
                }
            
            this._model.showEditForm('Dados da Loja', onUpdate)
           
            
            console.log('edit operation completed')


            this.contextMenu.removeContextMenu();
        
    }

   
    


}