class HeadquarterStoreModel extends CompanyModel{
    constructor(data={}) {
        super()
        this.category = 'headquarter-store';
        this._language = 'pt-BR'; // Use a different property to store the language
        this._collection = new Collection('headquarter-stores')
        this.industry = 'retail'
        this.store_type= null
        this.banner_id = null
        this._color=null
        
        Object.assign(this, data)
    }

   
    get table(){
        return this._collection
    }

    set color(c){
      this._color = c
    }

    get color(){
      let c = this.geo?.activated_marker_color || null
      return c || new FormElement().randomColor()
    }
    
    parse(obj){
        obj.address = new AddressModel(obj.address)
        Object.assign(this, obj )
        return this.formData
    }

    static headquerterStores(tenant){
      let list = new HeadquarterStoreModel().table.findBy('tenant_id', tenant)
      
        return list.map(item=>(
          {
            id:item.id, 
            label:item.name,
          }
        ))
      
    }

   
    get storeTypeOptions() {
      return new StoreTypes(this.language).options;
    }
    
    get storeTypesDropdown() {
      console.log('storeTypesDropdown',this.storeTypeOptions)
      return new FormElement().dropdown(this.storeTypeOptions, this.store_type, this.handleStoreTypeChange.bind(this), 'Selecione o tipo de loja ...');
    }
    
    handleStoreTypeChange(event) {
      this.store_type = event.target.value;
      console.log('Selected store Type:', this.store_type);
    }

    bannerDropdown(options) {
      console.log('bannerDropdown', this.banner_id)
      return new FormElement().dropdown(options, this.banner_id, this.handleBannerChange.bind(this), 'Selecione a bandeira ...');
    }
    
    handleBannerChange(event) {
      this.banner_id = event.target.value;
      console.log('Selected Banner:', this.banner_id);
    }

   
    
    showEditForm(title, onUpdate){

        //89445052000185
        let f = new FORM()
        f.title = title
        
        let address = new AddressModel(this.address)
        let banners = BannerModel.options(this.tenant_id)
        
        if (!banners.length){
          alert('é necessario adicionar uma bandeira antes de inserir uma loja...')
          return;
        }
        console.log('HeadquarterStoreModel form banners', banners)
        
        
        const colorPickerElement = new FormElement().colorPicker(this.color, (event) => {
          console.log('Selected color:', event.target.value);
          this.geo.activated_marker_color = event.target.value
        }, 'Cor');
        
        let content = new FormElement().contentContainer()
    
        content.appendChild(this.main_form_group)
        //content.appendChild(banner.form)
    
        let dropDownsGroup = new FormElement().groupInLineContainer()
        dropDownsGroup.appendChild(this.storeTypesDropdown);
        dropDownsGroup.appendChild(this.legalTypeDropdown);
        dropDownsGroup.appendChild(this.bannerDropdown(banners));
        dropDownsGroup.appendChild(colorPickerElement);
    
        content.appendChild(dropDownsGroup)
    
          
        content.appendChild(address.condensedFormGroup)
        
        let saveBtn = new FormElement()
        
        saveBtn.onSubmit = async()=>{
          //this.address = address.data
          //showSpinner();
                    
          try {
              saveBtn.submitButtonElement.appendChild(saveBtn.spinner)
              this.address=address.data
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