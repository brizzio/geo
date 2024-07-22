class HeadquarterStoreModel extends CompanyModel{
    constructor(data={}) {
        super()
        this.category = 'headquarter-store';
        this._language = 'pt-BR'; // Use a different property to store the language
        this._collection = new Collection('headquarter-stores')
        this.industry = 'retail'
        this.store_type= null
        this.banner = null
        
        Object.assign(this, data)
    }

   
    get table(){
        return this._collection
    }

    
    parse(obj){
        obj.address = new AddressModel(obj.address)
        Object.assign(this, obj )
        return this.formData
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

   
    
    showEditForm(title, onUpdate){

        //89445052000185
        let f = new FORM()
        f.title = title
        
        let address = new AddressModel(this.address)
        let banner = new BannerModelOld(this.banner)
        console.log('no form banner', banner)
        
        let content = new FormElement().contentContainer()
    
        content.appendChild(this.main_form_group)
        content.appendChild(banner.form)
    
        let dropDownsGroup = new FormElement().groupInLineContainer()
        dropDownsGroup.appendChild(this.storeTypesDropdown);
        dropDownsGroup.appendChild(this.legalTypeDropdown);
    
        content.appendChild(dropDownsGroup)
    
        content.appendChild(address.condensedFormGroup)
        
        let saveBtn = new FormElement()
        
        saveBtn.onSubmit = async()=>{
          //this.address = address.data
          //showSpinner();
                    
          try {
              saveBtn.submitButtonElement.appendChild(saveBtn.spinner)
              this.address=address.data
              this.banner=banner.data
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