class BranchStoreModel extends CompanyModel{
    constructor(data={}) {
        super()
        this.category = 'branch-store';
        this.parent_id = null
        this._language = 'pt-BR'; // Use a different property to store the language
        this._collection = new Collection('branch-stores')
        this.industry = 'retail'
        this.store_type= null
        this.banner_id = null
        this._color=null
        this.parent_data=null
        
        Object.assign(this, data)
    }

    
    set parent(value){
      this.parent_id = value
    }

    get parent(){
      return this.parent_id
    }

    get parentData(){
      let collection = new HeadquarterStoreModel().table
      console.log('parentData',collection)
      let item = collection.read(this.parent_id)
      console.log('parentData item',item)
      return item
    }

    get table(){
        return this._collection
    }

    set color(c){
      this._color = c
    }

    get color(){
      return this.geo.activated_marker_color || new FormElement().randomColor()
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

    hqStoreDropdown(options) {
      console.log('hqStore', this.parent_id)
      return new FormElement().dropdown(options, this.parent_id, this.handleHqStoreChange.bind(this), 'Selecione a Loja Matriz ...');
    }
    
    handleHqStoreChange(event) {
      this.parent_id = event.target.value;
      this.parent_data = this.parentData
      console.log('updated with HQ store:', this, this.parentData);
      //this.geo.activated_marker_color = data.geo.activated_marker_color
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
        let hqStores = HeadquarterStoreModel.headquerterStores(this.tenant_id)
        
        if (!hqStores.length){
          alert('é necessario ter uma matriz antes de inserir uma filial...')
          return;
        }
        console.log('HeadquarterStores', hqStores)
        
        let content = new FormElement().contentContainer()

        let headerGroup = new FormElement().groupInLineContainer()
        headerGroup.appendChild(this.hqStoreDropdown(hqStores));
        headerGroup.appendChild(this.bannerDropdown(banners));

        content.appendChild(headerGroup)

        const internalCodeInput = new FormElement().input('text', this.internal_code, 'Codigo interno da Loja', (event) => this.internal_code = event.target.value, 'Cod', null, null);

        const nameInput = new FormElement().input('text', this.name, 'Nome da fachada', (event) => this.name = event.target.value, 'Nome', null, null);

        let topGroup = new FormElement().groupInLineContainer()
        topGroup.appendChild(internalCodeInput)
        topGroup.appendChild(nameInput)

        content.appendChild(topGroup)
  
        const corporateNameInput = new FormElement().input('text', this.corporate_name, 'Razão Social da Loja', (event) => this.corporate_name = event.target.value, 'Razão Social', null, null);
  
        const cnpjInput = new FormElement().input('text', this.fiscal_code, 'CNPJ da Loja', (event) => this.fiscal_code = event.target.value, 'CNPJ', CompanyModel.cnpjMask, CompanyModel.validateCNPJ);

        let middleGroup = new FormElement().groupInLineContainer()
        middleGroup.appendChild(corporateNameInput)
        middleGroup.appendChild(cnpjInput)

        content.appendChild(middleGroup)
  
        const descriptionInput = new FormElement().input('textarea', this.description, 'descrição da Loja', (event) => this.description = event.target.value, 'Descrição', null, null);
        
        content.appendChild(descriptionInput)
       
        //Other store info
        let dropDownsGroup = new FormElement().groupInLineContainer()
        dropDownsGroup.appendChild(this.storeTypesDropdown);
        dropDownsGroup.appendChild(this.legalTypeDropdown);
        
    
        content.appendChild(dropDownsGroup)
    
        //Store Address
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