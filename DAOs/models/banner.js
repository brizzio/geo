class BannerModel {
    constructor(data={}) {
        
        this._language = 'pt-BR'; // Use a different property to store the language
        this._collection = new Collection('banners')
        this.id = null,
        this.code= null,
        this.name= null,
        this.description=null,
        this.logo_url= null,
        this.logo_base_64=null,
        
        Object.assign(this, data)
    }

    get language() {
      return this._language;
    }
  
    set language(lang) {
      this._language = lang;
    }

    get table(){
        return this._collection
    }

    set updateBase64Image(urlData){
      this.logo_base_64 = urlData
      console.log('banner image updated', urlData)
    }

    get logo(){
      return this.logo_base_64
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

    generateId(uid){
      this.id = uid || new Date().valueOf()
    }
   
    
    showEditForm(title, onUpdate){

        //89445052000185
        let f = new FORM()
        f.title = title
        
        console.log('no form banner', this)
        
        let content = new FormElement().contentContainer()
    
        const codeInput = new FormElement().input('text', this.code, 'Codigo Interno', (event) => this.code = event.target.value, 'Cod.', null, null);

        const nameInput = new FormElement().input('text', this.name, 'Nome da bandeira', (event) => this.name = event.target.value, 'Bandeira', null, null);
    
        const urlInput = new FormElement().input('text', this.logo_url, 'url do logotipo', (event) => {
          
          this.logo_url = event.target.value
          console.log('banner form logo changed', this.logo_url)
    
        }, 'Logo', null, null);
    
        const descriptionInput = new FormElement().input('textarea', this.description, 'descrição da bandeira', (event) => this.description = event.target.value, 'Descrição', null, null);
    
        let inputs = [
          codeInput,
          nameInput,
          descriptionInput,
          urlInput
        ]
        
        let group = new FormElement().groupContainer()
        // Append each input to the form container
        inputs.forEach(input => group.appendChild(input));

        content.appendChild(group);

        //upload file element
        let fileUp = new FormElement().fileUpload('Navegar ate o arquivo...',(value)=>this.logo_base_64 = value,'Logo')

        content.appendChild(fileUp);

        let saveBtn = new FormElement()
        
        saveBtn.onSubmit = async()=>{
          //this.address = address.data
          //showSpinner();
                    
          try {
              saveBtn.submitButtonElement.appendChild(saveBtn.spinner)
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