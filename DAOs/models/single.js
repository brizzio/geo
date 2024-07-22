class Single extends CompanyModel{
    constructor(data={}) {
        super()
        
        this.category='single';
        this._collection = new Collection('singles')
        
    }
   
    get table(){
        return this._collection
    }

    
    parse(obj){
        Object.assign(this, obj)
        return this.formData
    }
    

    static init(tenant, contextMenuLatLng){
        let s = new Single()
        s.tenant=tenant
        s.id = new Date().valueOf()
        s.geo={latlon:contextMenuLatLng}
        return s
    }

    showEditForm(map, latlng, asyncCallback){

        let form = new PopupForm()
        form.setPopupWidth(400); // Set width to 400px
        form.title = 'Single Edit'

        
        let content = new FormElement().contentContainer()

        let group = new FormElement().groupContainer()
        const nameInput = new FormElement().input('text', this.name, 'Nome do item de estudo', (event) => this.name = event.target.value, 'Nome', null, null);
        group.appendChild(nameInput)
        const descriptionInput = new FormElement().input('text', this.description, 'breve descrição do item', (event) => this.description = event.target.value, 'Descrição', null, null);
        group.appendChild(descriptionInput)


        content.appendChild(group)
      
        
        let saveBtn = new FormElement()
        
        saveBtn.onSubmit = async()=>{
          //this.address = address.data
          //showSpinner();
          console.log('no submit', this.formData)     
          try {
              saveBtn.submitButtonElement.appendChild(saveBtn.spinner)
              await asyncCallback(this.formData);
          } catch (error) {
              console.error(error);
          } finally {
              saveBtn.spinner.remove()
              form.closeForm();
          }
        }
        
        content.appendChild(saveBtn.submitButtonElement);
        form.html(content)
        form.show(latlng, map)
      }



}