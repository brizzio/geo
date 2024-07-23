class ClusterModel {
    constructor(data={}) {
        
        this._language = 'pt-BR'; // Use a different property to store the language
        this._collection = new Collection('clusters')
        this.id = null,
        this.tenant_id = null,
        this.code= null,
        this.name= null,
        this.description=null,

        this.members=[]
        this.concurrents=[]
       
        
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

    set tenant(t){
      this.tenant_id=t
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

    static options(tenant){
      let clusters = new ClusterModel().table.findBy('tenant_id', tenant)
      
        return clusters.map(item=>(
          {
            id:item.id, 
            label:item.name,
            description:item.description,
          }
        ))
      
    }
   
    
    showEditForm(title, onUpdate){

        let f = new FORM()
        f.title = title
        
        console.log('no cluster form', this)
        
        let content = new FormElement().contentContainer()
    
        const codeInput = new FormElement().input('text', this.code, 'Codigo do Cluster', (event) => this.code = event.target.value, 'Cod.', null, null);

        const nameInput = new FormElement().input('text', this.name, 'Nome do Cluster', (event) => this.name = event.target.value, 'Cluster', null, null);
            
        const descriptionInput = new FormElement().input('textarea', this.description, 'breve descrição do cluster', (event) => this.description = event.target.value, 'Descrição', null, null);
    
        let inputs = [
          codeInput,
          nameInput,
          descriptionInput
        ]
        
        let group = new FormElement().groupContainer()
        // Append each input to the form container
        inputs.forEach(input => group.appendChild(input));

        content.appendChild(group);

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