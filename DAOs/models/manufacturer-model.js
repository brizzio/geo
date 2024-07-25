class ManufacturerModel extends CompanyModel{
    constructor(data={}) {
        super()
        this.category = 'manufacturer';
        this._language = 'pt-BR'; // Use a different property to store the language
        this._collection = new Collection('manufacturer')
        
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
    
    showEditForm(title, onUpdate){

        //89445052000185
        let f = new FORM()
        f.title = title
        
        let address = new AddressModel(this.address)
        console.log('no form address', address)
        
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