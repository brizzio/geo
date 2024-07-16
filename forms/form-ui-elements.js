class FormElement {
    constructor(){
        this._saveButton = document.createElement('div')
        this._spinner = this.createSpinner()
        this._show_spinner = false
    }
    

    get submitButtonElement(){
        return this._saveButton
    }

    get spinner(){
        return this._spinner
    }

    set onSubmit(onSave){
        this._saveButton = this.saveButton(onSave)
    }

    set showSpinner(show){
        this._show_spinner = show
    }
    
    contentContainer() {
      const div = document.createElement('div');
      div.style.cssText = `
        
        border: none;
        display: flex;
        flex-direction: column;
        align-items: left;
        width: 100%;
      `;    
      return div;
    }

    groupContainer() {
        const div = document.createElement('div');
        div.style.cssText = `
          margin-bottom:5px;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: left;
          width: 100%;
        `;    
        return div;
      }
    
    groupInLineContainer() {
    const div = document.createElement('div');
    div.style.cssText = `
        margin-bottom:5px;
        border: none;
        display: flex;
        justify-content: space-evenly;
        align-items: left;
        width: 100%;
    `;    
    return div;
    }

    addressContainer(){
        //https://cssgrid-generator.netlify.app/
        const div = document.createElement('div');
        div.style.cssText = `
         .parent {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            grid-template-rows: repeat(3, 1fr);
            grid-column-gap: 0px;
            grid-row-gap: 0px;
            }

            .div1 { grid-area: 1 / 1 / 2 / 10; }
            .div2 { grid-area: 1 / 10 / 2 / 13; }
            .div3 { grid-area: 2 / 1 / 3 / 5; }
            .div4 { grid-area: 2 / 5 / 3 / 13; }
            .div5 { grid-area: 3 / 1 / 4 / 7; }
            .div6 { grid-area: 3 / 7 / 4 / 10; }
            .div7 { grid-area: 3 / 10 / 4 / 13; }
        `;    
        return div;
    }

    groupContainerBorderTopBottom() {
        const div = document.createElement('div');
        div.style.cssText = `
          padding: 5px;
          margin-top: 10px;
          border-top: 1px solid black;
          border-bottom: 1px solid black;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding-top: 15px; 
          padding-bottom: 15px; 
        `;    
        return div;
      }
  
    dropdown(options, selectedValue, onChange, placeholder = 'Selecione uma opção...') {
      const select = document.createElement('select');

      // Add the placeholder option
      const placeholderOption = document.createElement('option');
        placeholderOption.textContent = placeholder;
        placeholderOption.disabled = true;
        placeholderOption.selected = !selectedValue; // If no selectedValue, select the placeholder
        select.appendChild(placeholderOption);
  
      options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        optionElement.textContent = option.label;
        if (option.id === selectedValue) {
          optionElement.selected = true;
        }
        select.appendChild(optionElement);
      });
  
      select.addEventListener('change', (event) => {
        //console.log('Event target:', event.target);
        //console.log('Event target value:', event.target.value);
        onChange(event);
      });
  
      return select;
    }
  
    input(type, value, placeholder, onChange, labelText, mask = null, validate = null) {
      const container = document.createElement('div');
      container.style.cssText = `
        display: flex;
        justify-content:center; 
        align-items: center;
        margin-bottom: 2px;
        
      `;
  
      const label = document.createElement('label');
      label.textContent = `${labelText}:`;
      label.style.cssText = `
        
        font-size:12px;
        font-weight: thin;
      `;
      container.appendChild(label);
  
      const inputElement = document.createElement('input');
      inputElement.type = type;
      inputElement.value = value;
      inputElement.placeholder = placeholder;
      inputElement.style.cssText = `
        all: unset;
        padding: 4px;
        width: 100%;
        box-sizing: border-box;
        background-color:#e2e3e5;
        border-radius:8px;
        margin-left:3px;
        font-size:12px;
        color:blue;
      `;
  
      const applyMask = (value) => {
        if (mask) {
          return mask(value)
        }
        return value;
      };
  
      inputElement.addEventListener('input', (event) => {
        inputElement.style.border = 'none';
        if (mask) {
          inputElement.value = applyMask(event.target.value);
        }
      });
        //console.log('Event target:', event.target);
        //console.log('Event target value:', event.target.value);

        inputElement.addEventListener('change', (event) => {
             //console.log('Event target value:', event.target.value);
            if (validate) {
                const isValid = validate(event.target.value);
                if (!isValid) {
                inputElement.style.borderStyle = 'solid';
                inputElement.style.borderColor = 'red';
                return;
                }
            }
        
            inputElement.style.border = 'none';
            onChange(event);
            
        });
        
       
      
  
      container.appendChild(inputElement);
      return container;
    }

    saveButton(onClick){
        let div = document.createElement('div')
        div.style.cssText = `
        position:relative;
        display: flex;
        justify-content:center; 
        align-items: center;
        margin-top: 5px;
      `;
        // creating button element
        let button = document.createElement('button');
        button.id='btnSave'
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

        .disabled {
        opacity: 0.6;
        cursor: not-allowed;
        }

      `;

        // Adding event listeners for hover effect
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#2d661b';
        });

        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#04AA6D';
        });
        // creating text to be
        //displayed on button
        let text = document.createTextNode("Salvar");

        // appending text to button
        if(this._show_spinner){
            button.appendChild(this._spinner)
        }else{
            button.appendChild(text);
        }
        
        button.onclick = onClick;
        // appending button to div
        div.appendChild(button);
        return div
    }

    createSpinner(){

       /*  let wrapper = document.createElement('div')
        wrapper.style.cssText = `
        display:${show?'block':'none'}; 
        width:100%;
        height:100%;
        background: rgba(0, 0, 0, 0.5);
        border-radius:15px;        
        `; */

        let div = document.createElement('div')
        div.style.cssText = `
        position: absolute;
        top:8px;
        right:3px; 
        z-index: 9999;
        width:20px;
        height:20px;
        border-radius:50%;
        padding:1px;
        background:conic-gradient(#0000 10%,#F4ECEA) content-box;
        -webkit-mask:
            repeating-conic-gradient(#0000 0deg,#000 1deg 20deg,#0000 21deg 36deg),
            radial-gradient(farthest-side,#0000 calc(100% - 18px),#000 calc(100% - 16px));
        -webkit-mask-composite: destination-in;
        mask-composite: intersect;
        animation:s3 1s infinite steps(10);
        
        `;

       return div
    }

    
  
  }
  
  
  
  
  class FORM {
    constructor() {
      this._overlay = this.overlay();
      this._formContainer = this.formContainer();
      this._form_header = this.formHeader();
      this._cancelButton = this.cancelButtonElement();
      this._title = null; // Initialize title property
    }
  
    get title() {
      return this._title;
    }
  
    set title(t) {
      this._title = t;
    }
  
    overlay() {
      const div = document.createElement('div');
      div.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        overflow: hidden;
      `;
      return div;
    }
  
    formContainer() {
      const div = document.createElement('div');
      div.style.cssText = `
        position: relative;
        background: white;
        padding-right: 10px;
        padding-left: 10px;
        border: 1px solid #ccc;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        justify-content: start;
        align-items:center; 
        min-width:50%;
        
      `;
      return div;
    }

    formHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
          position: relative;
          margin: 5px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
        `;
    
        if (this.title) {
          const tit = document.createElement('span');
          tit.style.cssText = `
            width: auto;
            background: transparent;
            border: none;
            font-size: 14px;
            font-weight: normal;
          `;
          tit.textContent = this.title;
          header.appendChild(tit);
        }
    
        const hr = document.createElement('hr');
        hr.style.cssText = `
            border: 1px solid gray;
            width: 20%;
            margin: 10px 0;
            padding: 0;
            `;
    
        header.appendChild(hr);
        header.appendChild(this.cancelButtonElement());
    
        return header;
    }
    
    html(content) {
      // Clear the form container before appending new elements
      while (this._formContainer.firstChild) {
        this._formContainer.removeChild(this._formContainer.firstChild);
      }
      

      this._formContainer.appendChild(this.formHeader());
      //let elements = this.formElementsContainer(content);
      this._formContainer.appendChild(content);
      this._overlay.appendChild(this._formContainer);
      document.body.appendChild(this._overlay);
    }
  
    cancelButtonElement() {
      let btn = document.createElement('span');
      btn.innerHTML = `<i class="fa fa-times" aria-hidden="true"></i>`;
      btn.style.cssText = `
        position: absolute;
        padding: 0;
        margin:0;
        top: 0;
        right: 10px;
        width: 10px;
        background: transparent;
        border: none;
        cursor: pointer;
      `;
  
      btn.addEventListener('click', this.closeForm.bind(this));
      return btn;
    }

  
    closeForm() {
      console.log('form cancel clicked');
      this._overlay && this._overlay.remove();
    }

    
  }