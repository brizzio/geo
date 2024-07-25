class SupplyerModel {
    constructor(data={}) {
        
        this._language = 'pt-BR'; // Use a different property to store the language
        this._collection = new Collection('supplyers')
        this.id = null,
        this.tenant_id = null,
       
        description=null
        
        supplierCode=null
        // nome fantasia ou razão social do fornecedor do produto
        supplierDescription=null
        
        
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

    get tenant(){
      return this.tenant_id
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

    save(){
      this.table.create(this.data);
    }

    update(data){
      Object.assign(this,data);
    }
    
    static selector(model){
  
      let clusters = model.table.findBy('tenant_id', model.tenant)
      let opt =  clusters.map(item=>(
        {
          id:item.id, 
          label:item.name,
          description:item.description,
        }
      ))

      function handleSelect(event) {
        const mapped = clusters.reduce((map, c) => map[c.id] =c, {});
        model.update(mapped[event.target.value]);
      }
      
      function handleAdd(str) {
        model.generateId()
        model.name = str
      }

      return new FormElement().editableDropdown(opt, model.cluster_id, handleSelect, 'Selecione a bandeira ...', handleAdd);
       
      
    }

    static input(model, key, label, placeholder=''){
      return new FormElement().input('text', model[key], placeholder, (event) => {
        model[key] = event.target.value
        model=Object.assign(model, model[key])
        console.log('cluster input', model)
      }, label, null, null);
    }


    static pageForm(instance){

           
      console.log('no page form', instance)
      
      let content = new FormElement().contentContainer()
  
      const codeInput = new FormElement().input('text', instance.code, 'Codigo do Cluster', (event) => {
        instance.code = event.target.value
        instance=Object.assign(instance, {code:instance.code})
        console.log('cluster code input', instance)
      }, 'Cod.', null, null);

      const nameInput = new FormElement().input('text', instance.name, 'Nome do Cluster', (event) => {
        instance.name = event.target.value
        instance=Object.assign(instance, {name:instance.name})
        console.log('cluster code input', instance)
      }, 'Cluster', null, null);
          
      const descriptionInput = new FormElement().input('textarea', instance.description, 'breve descrição do cluster', (event) => {
        instance.description = event.target.value
        instance=Object.assign(instance, {description:instance.description})
        console.log('cluster description input', instance)
      }, 'Descrição', null, null);
  
      let inputs = [
        codeInput,
        nameInput,
        descriptionInput
      ]
      
      let group = new FormElement().groupContainer()
      // Append each input to the form container
      inputs.forEach(input => group.appendChild(input));

      content.appendChild(group);

     
      //button
      let buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 5px;
      `;

      // creating button element
      let button = document.createElement('button');
      button.id = 'btnSave';
      button.style.cssText = `
          background-color: #04AA6D; /* Green */
          border: none;
          color: white;
          width: 100%;
          height: 2rem;
          padding: 3px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          transition-duration: 0.4s;
          cursor: pointer;
      `;

      // Adding event listeners for hover effect
      button.addEventListener('mouseover', () => {
          button.style.backgroundColor = '#2d661b';
      });

      button.addEventListener('mouseout', () => {
          button.style.backgroundColor = '#04AA6D';
      });

      // creating text to be displayed on button
      let text = document.createTextNode('SALVAR');

      // appending text to button
      button.appendChild(text);
    
      button.onclick = async () => {
          instance.generateId()
          instance.save(instance.data)
          console.log('cluster saved', instance)
      };

      // appending button to buttonContainer
      buttonContainer.appendChild(button);
      
      
      content.appendChild(buttonContainer);
      return content
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