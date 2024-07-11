
class SearchResultModel {
  constructor(data={}) {
      
      this.id = null;
      this.place_id = null
      this.osm_type = null;
      this.osm_id = null;
      this.check_date=null;
      this.lat=null;
      this.lon=null;
      this.class = null;
      this.store_type = null;
      this.importance = null
      this.addresstype = null;
      this.name = null;
      this.brand = null;
      this.display_name = null;
      this.website = null;
      this.operator = null;
      this.tags = null;
      this.address = null;
      this.opening_hours= null;
      this.contacts=null;
      this.description=null;
      this.boundingbox = null;
      this.geo=null

      Object.assign(this, data)

      
  }

  get data(){
    return Object.assign({}, this)
  }

  static get formData(){
      return Object.assign({}, new SearchResultModel.data)
  }

  static parseFromNominatimSearchObject(obj){
    //console.log('nominatim', obj)
    let parsed = new SearchResultModel(obj)

    if (parsed.class == "shop"){
      parsed.store_type = obj.type 
      //remove dupe
      delete parsed.type
    }

    if (parsed.address.shop){
      parsed.brand = parsed.address.shop 
      //remove dupe
      delete parsed.address.shop
    }

    let temp = parsed.address
    parsed.id=new Date().valueOf()
    parsed.address = AddressModel.parseNominatimAddress(temp)
    parsed.geo = GeoModel.parseNominatimAddress(temp)
    parsed.geo.latlon = [parsed.lat, parsed.lon]
    //parsed.boundingbox = SearchResultModel.getBoundingBox(parsed.lat, parsed.lon, 50);
   
    return parsed.data
  }

  static parseFromOverpassSearchObject(obj){
    //console.log('overpass', obj)
    let tags = obj.tags || {}
    let lat , lon

    if (obj.type === 'node') {
      lat = obj.lat;
      lon = obj.lon;
      } else if (obj.type === 'way' || obj.type === 'relation') {
          lat = obj.center.lat;
          lon = obj.center.lon;
    }

    let parsed = {
      id:new Date().valueOf(),
      place_id: obj['id'] || null,
      osm_type: obj['type'] || null,
      lat: lat || null,
      lon: lon || null,
      check_date:obj['check_date'] || null,
      osm_id: obj['id'] || null,
      class: tags['shop']?"shop": null,
      store_type: tags['shop'] || null,
      addresstype: tags['shop']?"shop": null,
      name: tags['name'] || tags['short_name'] || null,
      brand: tags['brand'] || null,
      operator: tags['operator'] || null,
      tags: {
        amenity: tags['amenity'] || null,
        healthcare: tags['healthcare'] || null,
        leisure: tags['leisure'] || null,
        cuisine: tags['cuisine'] || null,
        capacity: tags['capacity'] || null
      },
      opening_hours: tags['opening_hours'] || null,
      description: tags['description'] || null,
      geo:{}
      
    }

    
    parsed.address = AddressModel.parseFromOverpassSearchTagsObject(tags)
    parsed.boundingbox = SearchResultModel.getBoundingBox(parsed.lat, parsed.lon, 50);
    parsed.contacts = ContactsModel.parseFromOverpassTagsObject(tags)
    
    //console.log('overpass parsed', parsed)
    parsed.geo.latlon = [lat, lon]
    
    let parsedItem = new SearchResultModel(parsed)
   
    return parsedItem.data
  }

  static getBoundingBox(lat, lon, distance) {
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


class AddressModel {
  constructor(data = {}) {

      
      this.street= null,
      this.street_number = null,
      this.street_number_complemnent = null,
      this.neighbourhood= null,
      this.suburb= null,
      this.city= null,
      this.state= null,
      this.region= null,
      this.postcode= null,
      this.country= null,
      this.country_code= null,
  
      Object.assign(this, data)
  }

  get data(){
      return Object.assign({}, this)
  }

  static get formData(){
      return Object.assign({}, new AddressModel().data)
  }

  static parseFromOverpassSearchTagsObject(tags){
      let parsed = {
          
          street_number:tags['addr:housenumber'] || null,
          street:tags['addr:street'] || null,
          neighbourhood:tags['addr:neighbourhood'] || null,
          suburb:tags['addr:suburb'] || null,
          city:tags['addr:city'] || null,
          state:tags['addr:state'] || null,
          region:tags['addr:region'] || null,
          postcode:tags['addr:postcode'] || null,
          opening_hours:tags['opening_hours'] || null,
          country:tags['addr:country'] || null,
          country_code:tags['addr:country_code'] || null
      }
      
        return new AddressModel(parsed).data
        
  }

  static parseNominatimAddress(address){

    function renameProperty(obj, oldProp, newProp) {
      if (oldProp in obj) {
          obj[newProp] = obj[oldProp]; // Add the new property
          delete obj[oldProp]; // Delete the old property
      }
    }
    
    renameProperty(address, 'road', 'street');
    renameProperty(address, 'house_number', 'street_number');

    let model = new AddressModel().data
     // Create a new object with only the properties that exist in class
     const filteredData = Object.keys(model)
     .filter(key => key in address)
     .reduce((obj, key) => {
         obj[key] = address[key];
         return obj;
     }, {});
    
    
    return new AddressModel(filteredData).data
      
  }

  get stringify(){

    const street= this.street || ''
    const street_number = this.street_number  || ''
    const street_number_complement = this.street_number_complement  || ''
    const neighbourhood= this.neighbourhood || ''
    const suburb= this.suburb || ''
    const city= this.city || ''
    const state= this.state || ''
    const region= this.region || ''
    const postcode= this.postcode || ''
    const country= this.country || ''
    const country_code= this.country_code || ''

    if (!street) return;

    const line1 = `${street}${street_number?', ':''}${street_number}${street_number_complement?'/ ':''}${street_number_complement}${neighbourhood?'- ':''}${neighbourhood}`

    const line2 = `${city}${state?'- ':''}${state}${country?'- ':''}${country}${postcode?'- ':''}${postcode}`

    return `${line1} ${line2}`
    
  }

  get html(){
    let header = `<strong>Endereço:</strong><br>`
    let data = Object.keys(this.data).map(key=> this.data[key] && `<strong>${key}:</strong> ${this.data[key]}<br>`).join('')
    return header + data
  }
    
}

class GeoModel {
  constructor(data = {}) {

    this.city_district= null;
    this.municipality= null;
    this.county= null;
    this.state_district= null;
    this['ISO3166-2-lvl4']= null;
    this.region= null;
    
      Object.assign(this, data)
  }

  get data(){
      return Object.assign({}, this)
  }

  static get formData(){
      return Object.assign({}, new AddressModel().data)
  }

 
  static parseNominatimAddress(address){
  
    let model = new GeoModel().data
     // Create a new object with only the properties that exist in class
     const filteredData = Object.keys(model)
     .filter(key => key in address)
     .reduce((obj, key) => {
         obj[key] = address[key];
         return obj;
     }, {});
    
    
    return new GeoModel(filteredData).data
      
  }
    
}

class ContactsModel {
  constructor(data={}) {

    this.phone= null
    this.website= null

    Object.assign(this, data)
      
  };

  get data(){
    return Object.assign({}, this)
  }

  static get formData(){
    return Object.assign({}, new ContactsModel().data)
  }

  static parseFromOverpassTagsObject(tags){
    let parsed = {
        phone:tags['contact:phone'] || tags['phone'] || null,
        website:tags['website'] || tags['contact:website'] || null
    }
    let parsedItem = new ContactsModel(parsed)
    return  parsedItem.data
  
  }
      
}



class BannerModel {
  constructor(data = {}) {

      this.id = null,
      this.code= null,
      this.name= null,
      this.logo_url= null,
  
      Object.assign(this, data)
  }

  get data(){
      return Object.assign({}, this)
  }

  get formInputs(){
    return[
      { field: 'code', label: 'Codigo Interno', placeholder: 'Nome da bandeira usado internamente', type:'text' },
      { field: 'name', label: 'Bandeira', placeholder: 'Nome da bandeira', type:'text' },
      { field: 'logo_url', label: 'Logotipo', placeholder: 'Url da imagem', type:'image_url' },

    ]
    
  }

  static get formData(){
      let address = new BannerModel()
      return Object.assign({}, address.data)
  }

  static init(data){
      let parsed = {
          
          id: data.id || new Date().valueOf(),
          code: data.code|| null,
          name: data.name || null,
          logo_url: data.logo_url || null,
      }
      
      let banner = new BannerModel(parsed)
      return banner
  }

  updateCode(code){
    this.code = code
  }

  updateName(name){
    this.name = name
  }

  updateLogo(url){
    this.logo_url = url
  }

  createFromFormData(formData){
    let data = {...formData, id:new Date().valueOf()}
    return new BannerModel(data)
  }

  
}







class CompanyModel {
    constructor(data = {}) {
       
        this.category='null'
        this.id= null,
        this.parent_id = null,
        this.name= null,
        this.corporate_name= null,
        this.internal_code= null,
        this.fiscal_code= null,
        this.logo= '',
        this.industry= null,
        this.legal_type= null,
        this.founded_year= null,
        this.employees= null,
        this.contacts = null,
        this.description= null,
        this.building= null,
        this.address=null
        this.geo=null
        this.tags=null

        Object.assign(this, data)
     
    }

    static get industries(){
      return getOptionsListFromConstant(industries, 'pt-BR')
    }

      get data(){
        return Object.assign({}, this)
    }

    get formInputs(){
      return null
      
    }

    static get formData(){
        return Object.assign({}, new CompanyModel().data)
    }

    static parseFromSearchItemData(data){

        let c = new CompanyModel()

        c.id = new Date().valueOf()
        c.category=data.category
        c.building=data.addresstype
        c.name=data.name || data.brand
        c.corporate_name=data.operator
        c.tags=data.tags
        c.address = data.address
        c.contacts = data.contacts
        c.description = data.description
        c.geo = data.geo
        
        return c

    }

    
    
}

class StoreModel extends CompanyModel {

  
  constructor(data = {}) {
    super(data)

    this.store_type= null
    
    Object.assign(this, data)
  }

  get formData(){
    return Object.assign({}, this.data)
  }

  static parseFromSearchItemData(searchData){

    
    let company = CompanyModel.parseFromSearchItemData(searchData).data
    let store = new StoreModel(company)

    let industry = Industries.item('retail')
    
    store.industry = industry.id
    store.store_type=searchData.store_type
    store.facade=searchData.brand
    store.opening_hours=searchData.opening_hours
    
    return store

}

}



class SearchItems{
  constructor(){
    this.storage = new LocalStorageManager('search',[])
  }

  get data(){
    return this.storage.getAllItems()
  }

  

  add(item){
    this.storage.addItem(item)
  }

  
  setVisited(item_place_id){
      
      this.storage.updateItemProperty(
        'place_id',
        item_place_id,
        'visited',
        true
      )
  }
  update(item_place_id){
    
    if (Array.isArray(data)) {
        const index = data.findIndex(item => item.place_id === item_place_id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updateObject };
        } else {
            console.error(`Item with id ${id} not found.`);
        }
    } else if (data && typeof data === 'object') {
        if (data[id]) {
            data[id] = { ...data[id], ...updateObject };
        } else {
            console.error(`Item with key ${id} not found.`);
        }
    }
    this.setStoredData(data);
  }
}


class MapTree{
     // Private fields
     #storage;
     #id;
     
    constructor(id){
        this.#id = id + '-mt'
        this.headquarters=[]
        this.banners=[]
        this.stores=[]
        this.areas=[]
        this.#storage = new LocalStorageManager(this.#id)
        
        this.load()
    }

    get tree(){
        
        // Get all property names
        const propertyNames = Object.getOwnPropertyNames(this);
        // Filter out private fields
        const publicProperties = propertyNames.filter(prop => !prop.startsWith('#'));
        // Create a new object with only public properties
        const publicObject = {};
        publicProperties.forEach(prop => {
            publicObject[prop] = this[prop];
        });

        return publicObject;

    }

    load(){
        let data = this.#storage.getAllItems()
        
        data && Object.keys(this.tree).forEach(key => this[key]= data[key])
        
        
    }

    addHeadquarter(hq){

        if(this.findCompany(hq.company_id)) return;

        
        
        let newHq = {
            company:hq,
            branches:[],

        }
        this.headquarters.push(newHq)
        this.update()
    }

    addBanner(banner){

      if(this.findBanner(banner.id)) return;
      console.log('adding banner', banner)
      this.banners.push(banner)
      this.update()
  }

    addBranch(headquarterIndex, newBranch){

        try {
            let hq = this.headquarters[headquarterIndex]
            let branches = [...hq.branches, newBranch]
            hq.branches = branches
            this.headquarters[headquarterIndex] = hq
            this.update()
        } catch (error) {
            console.log('MAP TREE addBranch error', error, headquarterIndex, newBranch)
        }
        

    }

    update(){
        this.#storage.setStoredData(this.tree)
    }

    findCompany(id) {
        return this.headquarters.find(element => element['company_id'] !== undefined && element['company_id'] === id);
    }

    findBanner(id) {
      return this.banners.find(element => element['id'] !== undefined && element['id'] === id);
    }
    /* findObjectInArray(array, property, value) {
        return array.find(element => element[property] !== undefined && element[property] === value);
    } */
}



function objectValuesToString(obj) {
    return Object.values(obj).filter(value => value).join(', ');
}



/*  let overpass={
  "type": "node",
  "id": 4128370892,
  "lat": -23.5573937,
  "lon": -46.6613810,
  "tags": {
    "addr:city": "São Paulo",
    "addr:country": "BR",
    "addr:housenumber": "2277",
    "addr:postcode": "01311-300",
    "addr:state": "São Paulo",
    "addr:street": "Avenida Paulista",
    "brand": "Riachuelo",
    "brand:wikidata": "Q6668462",
    "brand:wikipedia": "pt:Lojas Riachuelo",
    "check_date": "2024-06-08",
    "contact:phone": "+55 11 2895-0020",
    "contact:website": "http://www.riachuelo.com.br/",
    "name": "Riachuelo",
    "opening_hours": "Mo-Sa 09:00-21:00; Su 11:00-20:00",
    "shop": "clothes"
  }
}


let nominatim = {
  "place_id": 7145121,
  "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
  "osm_type": "way",
  "osm_id": 673095700,
  "lat": "-23.4811284",
  "lon": "-47.42060364350246",
  "class": "shop",
  "type": "bakery",
  "place_rank": 30,
  "importance": 0.0000649080643930269,
  "addresstype": "shop",
  "name": "Padaria Real",
  "display_name": "Padaria Real, 2650, Avenida Engenheiro Carlos Reinaldo Mendes, Jardim Bela Vista, Jardim Jockey Club, Sorocaba, Região Imediata de Sorocaba, Região Metropolitana de Sorocaba, Região Geográfica Intermediária de Sorocaba, São Paulo, Região Sudeste, 18013-280, Brasil",
  "address": {
      "shop": "Padaria Real",
      "house_number": "2650",
      "road": "Avenida Engenheiro Carlos Reinaldo Mendes",
      "neighbourhood": "Jardim Bela Vista",
      "suburb": "Jardim Jockey Club",
      "city_district": "Sorocaba",
      "city": "Sorocaba",
      "municipality": "Região Imediata de Sorocaba",
      "county": "Região Metropolitana de Sorocaba",
      "state_district": "Região Geográfica Intermediária de Sorocaba",
      "state": "São Paulo",
      "ISO3166-2-lvl4": "BR-SP",
      "region": "Região Sudeste",
      "postcode": "18013-280",
      "country": "Brasil",
      "country_code": "br"
  },
  "boundingbox": [
      "-23.4813410",
      "-23.4809142",
      "-47.4210980",
      "-47.4201088"
  ]
}

//console.log('test item model', SearchResultModel.parseFromNominatimSearchObject(nominatim))
const sr = SearchResultModel.parseFromNominatimSearchObject(nominatim)
console.log('test overpass item model', sr)
sr.category = 'headquarter'
console.log('test overpass item company', CompanyModel.parseFromSearchItemData(sr).data)

console.log('store ==========', StoreModel.parseFromSearchItemData(sr).data)
console.log('store ==========', StoreModel.parseFromSearchItemData(sr).formData)
 
 



console.log('industry ==========', Industries.item('retail'))
console.log('store type ==========', StoreTypes.item('furniture_store'))

 */









  

