
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

  geolocateByAddressString(address) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1`;

    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    console.log('data:', data);
                    resolve(SearchResultModel.parseFromNominatimSearchObject(data[0]));
                } else {
                    reject(new Error('No results found'));
                }
            })
            .catch(error => {
                console.error('Error fetching the geocoding data:', error);
                reject(error);
            });
    });
}

  static parseFromNominatimSearchObject(obj){
    //console.log('nominatim', obj)
    let parsed = new SearchResultModel(obj)

    if (parsed.class == "shop"){
      parsed.store_type = obj.type 
      //remove dupe
      delete parsed.type
    }

    if (parsed.address?.shop){
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
      let obj = Object.assign({},this)
      for (const key in obj) {
        if (key.startsWith('_')) {
          delete obj[key];
        }
      }
      return obj;
  }

  static get formData(){
      return Object.assign({}, new AddressModel().data)
  }

  update(updateObject){
    const nonNullSource = Object.fromEntries(
      Object.entries(updateObject).filter(([_, value]) => value !== null)
    );
      Object.assign(this, nonNullSource)
    
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

    console.log('vai dar um parse no endereço', address)

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

  get formInputsGroup(){

    let inputs = {}
    
    inputs.street = new FormElement().input('text', this.street, 'Logradourov / Rua / Av.', (event) => this.street = event.target.value, 'Log.', null, null);
    inputs.number = new FormElement().input('text', this.street_number, 'Numero', (event) => this.street_number = event.target.value, 'Num.', null, null);
    inputs.complement = new FormElement().input('text', this.street_number_complemnent, 'Complemento', (event) => this.street_number_complemnent = event.target.value, 'Compl.', null, null);
    inputs.neighbourhood = new FormElement().input('text', this.neighbourhood, 'Bairro', (event) => this.neighbourhood = event.target.value, 'Bairro', null, null);
    inputs.city = new FormElement().input('text', this.city, 'Cidade', (event) => this.city = event.target.value, 'Cidade', null, null);
    inputs.state = new FormElement().input('text', this.state, 'Sigla do Estado', (event) => this.state = event.target.value, 'UF', null, null);
    inputs.postcode = new FormElement().input('text', this.postcode, 'CEP', (event) => this.postcode = event.target.value, 'CEP', null, null);
    
    let group = new FormElement().groupContainer()
    Object.keys(inputs).forEach(input=>group.appendChild(inputs[input]))
    
    
    return group
  }

  get condensedFormGroup(){
    let grid = new FormElement().groupContainer()
    grid.style.cssText = `
       display: grid;
       grid-template-columns: repeat(12, 1fr);
       grid-template-rows: repeat(3, 1fr);
       grid-column-gap: 5px;
       grid-row-gap: 2px;
   `;    

    let streetDiv = document.createElement('div')
    streetDiv.style.cssText=`
      grid-area: 1 / 1 / 2 / 10;
    `
    let numberDiv = document.createElement('div')
    numberDiv.style.cssText=`
      grid-area: 1 / 10 / 2 / 13;
    `
    let complementDiv = document.createElement('div')
    complementDiv.style.cssText=`
      grid-area: 2 / 1 / 3 / 5;
    `
    let neighbourhoodDiv = document.createElement('div')
    neighbourhoodDiv.style.cssText=`
      grid-area: 2 / 5 / 3 / 13;
    `
    let cityDiv = document.createElement('div')
    cityDiv.style.cssText=`
      grid-area: 3 / 1 / 4 / 7;
    `
    let stateDiv = document.createElement('div')
    stateDiv.style.cssText=`
      grid-area: 3 / 7 / 4 / 10;
    `
    let postcodeDiv = document.createElement('div')
    postcodeDiv.style.cssText=`
      grid-area: 3 / 10 / 4 / 13;
    `

    let inputs = {}
    
    inputs.street = new FormElement().input('text', this.street, 'Logradourov / Rua / Av.', (event) => this.street = event.target.value, 'Log.', null, null);
    inputs.number = new FormElement().input('text', this.street_number, 'Numero', (event) => this.street_number = event.target.value, 'Num.', null, null);
    inputs.complement = new FormElement().input('text', this.street_number_complemnent, 'Complemento', (event) => this.street_number_complemnent = event.target.value, 'Compl.', null, null);
    inputs.neighbourhood = new FormElement().input('text', this.neighbourhood, 'Bairro', (event) => this.neighbourhood = event.target.value, 'Bairro', null, null);
    inputs.city = new FormElement().input('text', this.city, 'Cidade', (event) => this.city = event.target.value, 'Cidade', null, null);
    inputs.state = new FormElement().input('text', this.state, 'Sigla do Estado', (event) => this.state = event.target.value, 'UF', null, null);
    inputs.postcode = new FormElement().input('text', this.postcode, 'CEP', (event) => this.postcode = event.target.value, 'CEP', null, null);
    
    
    streetDiv.appendChild(inputs.street)
    numberDiv.appendChild(inputs.number)
    complementDiv.appendChild(inputs.complement)
    neighbourhoodDiv.appendChild(inputs.neighbourhood)
    cityDiv.appendChild(inputs.city)
    stateDiv.appendChild(inputs.state)
    postcodeDiv.appendChild(inputs.postcode)
    
    grid.appendChild(streetDiv)
    grid.appendChild(numberDiv)
    grid.appendChild(complementDiv)
    grid.appendChild(neighbourhoodDiv)
    grid.appendChild(cityDiv)
    grid.appendChild(stateDiv)
    grid.appendChild(postcodeDiv)

    return grid
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

class LanguageModel {
  constructor(lang = 'pt-BR') {
    this._languages = ['pt-BR', 'en-US', 'es-ES'];
    this._language = lang;
  }

  get language() {
    return this._language;
  }

  set language(lang) {
    this._language = lang;
  }

  get languageDropdown() {
   
    const select = document.createElement('select');

    this._languages.forEach(language => {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = language;
      if (language === this.language) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // Optional: Add event listener to update the language when the selection changes
    select.addEventListener('change', (event) => {
      this.language = event.target.value;
      console.log('language', this.language)
    });

    return select;
  }
}








class CompanyModel {
    constructor(data = {}) {
       
        this.category=null;
        this.id= null;
        this.parent_id = null;
        this.name= null;
        this.corporate_name= null;
        this.internal_code= null;
        this.fiscal_code= null;
        this.logo= '';
        this.industry= null;
        this.legal_type= null;
        this.founded_year= null;
        this.employees= null;
        this.contacts = null;
        this.description= null;
        this.building= null;
        this.address= {};
        this.geo=null;
        this.tags=null;

        Object.assign(this, data)
     
    }

    
    get formData(){
      return Object.assign({}, this.data)
    }

    static get industries(){
      return getOptionsListFromConstant(industries, 'pt-BR')
    }

    get data(){
      let obj = Object.assign({},this)
      for (const key in obj) {
        if (key.startsWith('_')) {
          delete obj[key];
        }
      }
      return obj;
    }

    get legalTypeDropdown() {
      let options = CompanyConstants.legalPersonOptions('pt-BR')
      return new FormElement().dropdown(options, this.legal_type, this.handleLegalTypeChange.bind(this), 'Selecione a pessoa juridica ...');
    }

    set updateAddress(objAddress){
      this.address = objAddress
    }

    load(payload){
      return Object.assign(this.data, payload)
    }

    update(updateObject){
      const nonNullSource = Object.fromEntries(
        Object.entries(updateObject).filter(([_, value]) => value !== null)
    );
      Object.assign(this, nonNullSource)
    }

    handleLegalTypeChange(event){
      this.legal_type = event.target.value;
      console.log('Selected legal type:', this.legal_type);
    }

    get main_form_group(){

      const internalCodeInput = new FormElement().input('text', this.internal_code, 'Codigo interno da Empresa', (event) => this.internal_code = event.target.value, 'Cod', null, null);

      const nameInput = new FormElement().input('text', this.name, 'Nome Fantasia', (event) => this.name = event.target.value, 'Nome', null, null);

      const corporateNameInput = new FormElement().input('text', this.corporate_name, 'Razão Social da Empresa', (event) => this.corporate_name = event.target.value, 'Razão Social', null, null);

      const cnpjInput = new FormElement().input('text', this.fiscal_code, 'CNPJ da Empresa', (event) => this.fiscal_code = event.target.value, 'CNPJ', CompanyModel.cnpjMask, CompanyModel.validateCNPJ);

      const descriptionInput = new FormElement().input('text', this.description, 'descrição da empresa', (event) => this.description = event.target.value, 'Descrição', null, null);

      let inputs = [
        //internalCodeInput,
        nameInput,
        //corporateNameInput,
        //cnpjInput,
        descriptionInput
      ]
      
      let group = new FormElement().groupContainer()
      // Create an input with CNPJ mask and validation
     
      // Append each input to the form container
      inputs.forEach(input => group.appendChild(input));
   
      
      return group
  
     
    }

    
    

    parseFromSearchItemData(data){

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

    // Example CNPJ validation function
  static validateCNPJ(cnpj){
    cnpj = cnpj.replace(/[^\d]+/g, '');
  
    if (cnpj.length !== 14) return false;
  
    // Eliminate invalid known CNPJs
    if (/^(\d)\1+$/.test(cnpj)) return false;
  
    // Validate verification digits
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += numbers.charAt(length - i) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result != digits.charAt(0)) return false;
  
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += numbers.charAt(length - i) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result != digits.charAt(1)) return false;
  
    return true;
  };

  static cnpjMask(value){
      return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
  }

  static validatePhone(){
    const phonePattern = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phonePattern.test(e.target.value)) return false;
    return true
  }

  static phoneMask(value){
    return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
    

    
    
}




class StoreModel extends CompanyModel {

  
  constructor(data = {}) {
    super()

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

class HeadquarterModel extends CompanyModel {
  constructor(data = {}) {
    super();
    this.category = 'headquarter';
    this._language = 'pt-BR'; // Use a different property to store the language
   
    Object.assign(this, data)
  }

  
  set language(lang) {
    this._language = lang; // Set the internal property
  }

  get language() {
    return this._language; // Return the internal property
  }

  get industryOptions() {
    return new Industries(this.language).options;
  }

  

  get industryDropdown() {
    return new FormElement().dropdown(this.industryOptions, this.industry, this.handleIndustryChange.bind(this), 'Selecione o ramo de atividade ...');
  }

  handleIndustryChange(event) {
    this.industry = event.target.value;
    console.log('Selected industry:', this.industry);
  }

  showControlButtonForm(onSave){

    //89445052000185
    let f = new FORM()
    f.title = 'Dados da Matriz'
    let address = new AddressModel()
    
    let content = new FormElement().contentContainer()

    content.appendChild(this.main_form_group)

    let dropDownsGroup = new FormElement().groupInLineContainer()
    dropDownsGroup.appendChild(this.industryDropdown);
    dropDownsGroup.appendChild(this.legalTypeDropdown);

    content.appendChild(dropDownsGroup)

    content.appendChild(address.condensedFormGroup)
    
    let saveBtn = new FormElement()
    
    saveBtn.onSubmit = async()=>{
      //this.address = address.data
      //showSpinner();
                
      try {
          saveBtn.submitButtonElement.appendChild(saveBtn.spinner)
          await onSave(this.formData);
      } catch (error) {
          console.error(error);
      } finally {
          saveBtn.spinner.remove()
          f.closeForm();
      }
    }
    
    content.appendChild(saveBtn.submitButtonElement);
    f.html(content)
  }

  showEditForm(onUpdate){

    //89445052000185
    let f = new FORM()
    f.title = 'Editor'
    
    let address = new AddressModel(this.address)
    
    let content = new FormElement().contentContainer()

    content.appendChild(this.main_form_group)

    let dropDownsGroup = new FormElement().groupInLineContainer()
    dropDownsGroup.appendChild(this.industryDropdown);
    dropDownsGroup.appendChild(this.legalTypeDropdown);

    content.appendChild(dropDownsGroup)

    content.appendChild(address.condensedFormGroup)
    
    let saveBtn = new FormElement()
    
    saveBtn.onSubmit = async()=>{
      //this.address = address.data
      //showSpinner();
                
      try {
          saveBtn.submitButtonElement.appendChild(saveBtn.spinner)
          this.updateAddress=address.data
          await onUpdate(this.data);
      } catch (error) {
          console.error(error);
      } finally {
          saveBtn.spinner.remove()
          f.closeForm();
      }
    }
    
    content.appendChild(saveBtn.submitButtonElement);
    f.html(content)
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
     
     
    constructor(id){
        this._id = id + '-mt'
        this.headquarters=[]
        this.banners=[]
        this.stores=[]
        this.areas=[]
        this._localstorage = new LocalStorageManager(this._id)
        
        this.load()
    }

    get tree(){
        
        // Get all property names
        const propertyNames = Object.getOwnPropertyNames(this);
        // Filter out private fields
        const publicProperties = propertyNames.filter(prop => !prop.startsWith('_'));
        // Create a new object with only public properties
        const publicObject = {};
        publicProperties.forEach(prop => {
            publicObject[prop] = this[prop];
        });

        return publicObject;

    }

    get storage(){
      return this._localstorage
    }

    load(){
        let data = this._localstorage.getAllItems()
        
        data && Object.keys(this.tree).forEach(key => this[key]= data[key])
        
        
    }

    addHeadquarter(hq){

        if(this.findCompany(hq.id)) return;
       
        this.headquarters.push(hq)
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
        this._localstorage.setStoredData(this.tree)
    }

    findCompany(id) {
        return this.headquarters.find(element => element['id'] !== undefined && element['id'] === id);
    }

    findBanner(id) {
      return this.banners.find(element => element['id'] !== undefined && element['id'] === id);
    }
    /* findObjectInArray(array, property, value) {
        return array.find(element => element[property] !== undefined && element[property] === value);
    } */

    //CRUD OPERATIONS
    


}



function objectValuesToString(obj) {
    return Object.values(obj).filter(value => value).join(', ');
}













  

