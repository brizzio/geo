class ConcurrentStoreModel extends CompanyModel{
    constructor(data={}) {
        super()
        this.category = 'concurrent-store';
        this.cluster_id = null
        this._language = 'pt-BR'; // Use a different property to store the language
        this._collection = new Collection('concurrent-stores')
        this.industry = 'retail'
        this.store_type= null
        this.banner_name = null
        this.banner_logo = null
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
      return 'red'
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

    clusterDropdown(options) {
      return new FormElement().dropdown(options, this.cluster_id, this.handleClusterChange.bind(this), 'Selecione o Cluster ...');
    }
    
    handleClusterChange(event) {
      this.cluster_id = event.target.value;
      console.log('updated with Cluster:', this, this.cluster_id);
      //this.geo.activated_marker_color = data.geo.activated_marker_color
    }

    bannerDropdown(options) {
      console.log('bannerDropdown', this.banner_id)
      return new FormElement().editableDropdown(options, this.banner_id, this.handleBannerChange.bind(this), 'Selecione a bandeira ...', this.handleBannerAdd.bind(this));
    }
    
    handleBannerChange(event) {
      this.banner_id = event.target.value;
      console.log('Selected Banner:', this.banner_id);
    }

    handleBannerAdd(newBannerName) {
      let newBanner = new BannerModel()
      newBanner.generateId()
      newBanner.name = newBannerName
      // Save the data
      newBanner.table.create(newBanner.data);
      this.banner_id = newBanner.id;
      
    }


   
    
    showEditForm(title, callback, mapContext){

        //89445052000185
        let f = new FORM()
        f.title = title
        
        let address = new AddressModel(this.address)
        let banners = new BannerModel().table.getAll()
        let bannersOptions = banners.map(item=>(
          {
            id:item.id, 
            label:item.name,
            description:item.description,
          }
        ))
        let clusters = ClusterModel.options(this.tenant_id)
        
        console.log('clusters', clusters)
        
        let content = new FormElement().contentContainer()

        let headerGroup = new FormElement().groupInLineContainer()
        headerGroup.appendChild(this.clusterDropdown(clusters));
        headerGroup.appendChild(this.bannerDropdown(bannersOptions));

        content.appendChild(headerGroup)

        

        const nameInput = new FormElement().input('text', this.name, 'Nome da fachada', (event) => this.name = event.target.value, 'Nome', null, null);

        let topGroup = new FormElement().groupInLineContainer()
        
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
              await callback(this.data, mapContext);
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
      
      //form callback when creating new record
      onCreate = async (d, context) => {
        try {
            // Let's geo locate the entered address
            // Create an address object from form address entries
            console.log('formData', d);
            let add = new AddressModel(d.address);
            console.log('onUpdate', add);
            let query = add.query 
            // Await the geolocation result
            const result = await SearchResultModel.geolocateByAddressString(query);
            console.log('ConcurrentStore geolocation', result); // This will log the result

            // Merge geolocation address data with original form data address
            let updated = new ConcurrentStoreModel(d).mergeSearchResult(result)
            console.log('before save ConcurrentStore data', updated.formData);

            //update icon color: 
            updated.geo.activated_marker_color = updated.color

            // Save the headquarter data
            updated.table.create(updated.formData);

            // show new marker
            // Creating a new marker with flyTo option
            const markerOptions = {
                flyTo: true
            };
            new ConcurrentStoreMarker(context, updated.formData, markerOptions)


            } catch (error) {
                console.log('ConcurrentStore onUpdate error', error);
            }
        }



}