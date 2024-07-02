class StoreMarker extends Marker {
    constructor(mapContext, latlng) {
        const iconUrl='https://maps.google.com/mapfiles/ms/icons/pink-dot.png'
       
        
        this.type = 'store' 
        this.id = id
        this.shop = type
        this.info = info
        this.name = name || 'Store Name'
        this.popupContent = this.generatePopupContent()

        super(mapContext, latlng,data, {}, []);
       
        
    }
   
    static init(map, data){
        const {latlng,id,name,info,options,type} = data
        console.log('init store', data)
        let store = new StoreMarker(map, latlng)
        console.log('init store METOD END', store)
        return store
    }

    parse(){
        return {
            latlng:this.latlng, 
            id:this.id, 
            name:this.name, 
            options:this.options, 
            info:this.info, 
            type:this.type,
            shop:this.shop
        }
    }

    

    generatePopupContent() {
        console.log('calling store marker popup', this.info)
        // Generate HTML content for the popup from the info object
        let header = `<strong>Store Id:</strong> ${this.id}<br><strong>Store Name:</strong> ${this.name}<br>`
        let data = Object.keys(this.info).map(tag => `<strong>${tag}:</strong> ${this.info[tag]}`).join('<br>');
        return header + data
    }

      
}