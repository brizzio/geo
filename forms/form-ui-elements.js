class FormElement {
    constructor(){
        this._saveButton = document.createElement('div')
        this._spinner = this.createSpinner()
        this._show_spinner = false
        this._cropper = null
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
        justify-content: flex-start;
        align-items: center;
        width: 100%;
        gap: 0.25rem; 
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
        width: 100%;
        
      `;
  
      const label = document.createElement('label');
      label.textContent = `${labelText}:`;
      label.style.cssText = `
        
        font-size:12px;
        font-weight: thin;
      `;
      container.appendChild(label);
  
      let inputElement;
      if (type === 'textarea') {
        inputElement = document.createElement('textarea');
      } else {
        inputElement = document.createElement('input');
        inputElement.type = type;
      }
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

    fileUpload(placeholder, onChange, labelText) {
      let currentKey;
      const container = document.createElement('div');
      container.style.cssText = `
        display: flex;
        flex-direction: column;
        justify-content: flex-start; 
        align-items: stretch;
        margin-bottom: 2px;
        
      `;

      //image Preview
      const preview = document.createElement('div')
      preview.style.cssText=`
      position: relative;
      width: 100%;
      height: 180px;
      margin: 20px 0;
      overflow: hidden;
      `

      const img = document.createElement('img')
      img.style.cssText=`
        width: auto;
        max-width: 100%;
        max-height: 180px; /* Ensures image doesn't exceed 180px in height */
        display: block;
      `

      const imageDimensions = document.createElement('div')
      imageDimensions.style.cssText=`
        position: absolute;
        bottom: 5px;
        left: 5px;
        color: white;
        font-size: 14px;
        background: rgba(0, 0, 0, 0.6);
        padding: 5px;
        border-radius: 3px;
        display: none;
      `
      preview.appendChild(img)
      preview.appendChild(imageDimensions)


      //inputs
      const label = document.createElement('label');
      label.textContent = `${labelText}:`;
      label.style.cssText = `
        
        font-size:12px;
        font-weight: thin;
      `;
      container.appendChild(label);

      //url text area
      let textArea = document.createElement('textarea');
      textArea.placeholder ='Digite a url da imagem...';
      textArea.style.cssText = `
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

      textArea.addEventListener('change', (e) => {
        //console.log('Event target value:', event.target.value);
       /* if (validate) {
           const isValid = validate(event.target.value);
           if (!isValid) {
           textArea.style.borderStyle = 'solid';
           textArea.style.borderColor = 'red';
           return;
           }
       } */
   
       textArea.style.border = 'none';
       //execute logic
       img.src = e.target.value;
          getImageDimensions(e.target.value)
            .then(dimensions => {
              updateDimensions( dimensions.width,   dimensions.height)
              //initCropper(file.name);
              const onCropCallback = async (resizedImageURL) => {
                console.log('Cropped and resized image URL:', resizedImageURL);
                // Perform additional actions with the cropped image URL
                img.src = resizedImageURL;
                //execute the caller callback... 
                onChange(resizedImageURL)
                getImageDimensions(resizedImageURL)
                .then(dimensions => {
                  updateDimensions( dimensions.width,   dimensions.height)
                })
                .catch(error => {
                  console.error('Error getting cropped image dimensions:', error);
                });
              };
              const cropper = new ImageCropper(img, onCropCallback);
              
              cropper.startCropping()

            })
            .catch(error => {
                console.error('Error getting image dimensions:', error);
            });

       });
       container.appendChild(textArea);
      

      //file input
      let inputElement = document.createElement('input');
      inputElement.type = 'file';
      inputElement.accept = "image/*"
      inputElement.placeholder = placeholder;
      inputElement.style.cssText = `
        all:unset;
        padding: 4px;
        width: 100%;
        box-sizing: border-box;
        background-color:#e2e3e5;
        margin-left:3px;
        font-size:12px;
        color:blue;
      `;

      function updateDimensions(width, height) {
        imageDimensions.textContent = `${Math.round(width)} x ${Math.round(height)} px`;
        imageDimensions.style.display = 'block';
    }

      function getImageDimensions(base64Data) {
          return new Promise((resolve, reject) => {
              const img = new Image();
      
              img.onload = () => {
                  resolve({
                      width: img.width,
                      height: img.height
                  });
              };
      
              img.onerror = (error) => {
                  reject(error);
              };
      
              img.src = base64Data;
          });
      }

        
      
      inputElement.addEventListener('change', (event) => {
          const file = event.target.files[0];
          if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                console.log('uploaded image', e.target)
                  img.src = e.target.result;
                  getImageDimensions(e.target.result)
                    .then(dimensions => {
                      updateDimensions( dimensions.width,   dimensions.height)
                      //initCropper(file.name);
                      const onCropCallback = async (resizedImageURL) => {
                        console.log('Cropped and resized image URL:', resizedImageURL);
                        // Perform additional actions with the cropped image URL
                        img.src = resizedImageURL;
                        //execute the caller callback... 
                        onChange(resizedImageURL)
                        getImageDimensions(resizedImageURL)
                        .then(dimensions => {
                          updateDimensions( dimensions.width,   dimensions.height)
                        })
                        .catch(error => {
                          console.error('Error getting cropped image dimensions:', error);
                        });
                      };
                      const cropper = new ImageCropper(img, onCropCallback);
                     
                      cropper.startCropping()

                    })
                    .catch(error => {
                        console.error('Error getting image dimensions:', error);
                    });

                    
                  
                  //this.initCropper(file.name); // Pass filename to initCropper
              };
              reader.readAsDataURL(file);
          }
      });
      
      container.appendChild(inputElement);
      container.appendChild(preview);
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

    colorPicker(value, onChange, labelText) {
      const container = document.createElement('div');
      container.style.cssText = `
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 2px;
      `;

      const label = document.createElement('label');
      label.textContent = `${labelText}:`;
      label.style.cssText = `
          font-size: 12px;
          font-weight: thin;
      `;
      //container.appendChild(label);

      const inputElement = document.createElement('input');
      inputElement.type = 'color';
      inputElement.value = value;
      inputElement.style.cssText = `
          all: unset;
          padding: 4px;
          width: 2rem;
          height: 2rem;
          
          margin-left: 3px;
          font-size: 12px;
      `;

      inputElement.addEventListener('change', onChange);

      container.appendChild(inputElement);
      return container;
  }

  asyncActionButton(title, onClick) {

        title = title.toUpperCase();
        let div = document.createElement('div');
        div.style.cssText = `
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
        let text = document.createTextNode(title);

        // appending text to button
        button.appendChild(text);
      

        button.onclick = async () => {
            button.appendChild(this._spinner);
            await onClick();
            this._spinner.remove()
        };

        // appending button to div
        div.appendChild(button);
        return div;
    }
    editableDropdown(options, selectedValue, onChange, placeholder = 'Selecione uma opção...', onAddNew) {
      const container = document.createElement('div');
      container.style.cssText = `
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 5px;
    `;

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

      const addNewOption = document.createElement('option');
      addNewOption.textContent = 'Adicionar novo...';
      addNewOption.value = 'add_new';
      select.appendChild(addNewOption);

      const inputContainer = document.createElement('div');
      inputContainer.style.cssText = `
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          padding: 10px;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          display: none;
          flex-direction: column;
          gap: 5px;
          z-index: 10;
      `;

      const newItemInput = document.createElement('input');
      newItemInput.type = 'text';
      newItemInput.placeholder = 'Digite o novo item';
      newItemInput.style.cssText = `
          flex-grow: 1;
          padding: 5px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
      `;

      const addButton = document.createElement('button');
      addButton.textContent = 'Adicionar';
      addButton.style.cssText = `
          padding: 5px 10px;
          font-size: 14px;
          background-color: #04AA6D;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
      `;

      addButton.addEventListener('click', () => {
          const newItem = newItemInput.value.trim();
          if (newItem) {
              onAddNew(newItem);
              const optionElement = document.createElement('option');
              optionElement.value = new Date().valueOf();
              optionElement.textContent = newItem;
              optionElement.selected = true;
              select.insertBefore(optionElement, addNewOption);
              inputContainer.style.display = 'none';
              newItemInput.value = '';
          }
      });

      inputContainer.appendChild(newItemInput);
      inputContainer.appendChild(addButton);

      select.addEventListener('change', (event) => {
          if (event.target.value === 'add_new') {
              inputContainer.style.display = 'flex';
          } else {
              inputContainer.style.display = 'none';
              onChange(event);
          }
      });

      container.appendChild(select);
      container.appendChild(inputContainer);

      return container;
    }


    generateUniqueKey() {
      return Math.random().toString(36).substring(7); // Generates a random key
    }

    randomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
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

  class PopupForm {
    constructor() {
        this.popup = null;
        this._formContainer = this.formContainer();
        this._form_header = this.formHeader();
        this._title = null; // Initialize title property
    }

    get title() {
        return this._title;
    }

    set title(t) {
        this._title = t;
    }

    get popupForm() {
        return this._formContainer;
    }

    show(latlng, map) {
        console.log('Showing form at latlng:', latlng);
        this.popup = L.popup()
            .setLatLng(latlng)
            .setContent(this._formContainer)
            .openOn(map);

        this.setPopupWidth(300); // Set the initial width, e.g., 300px
        console.log('Popup added to map');

        // Prevent clicks outside the form
        setTimeout(() => {
            const handleClickOutside = (event) => {
                if (this.form && !this.form.contains(event.target)) {
                    console.log('Clicked outside form');
                    this.onCancel();
                    this.hide();
                    document.removeEventListener('click', handleClickOutside);
                }
            };

            document.addEventListener('click', handleClickOutside);
        }, 100); // Introduce a 100ms delay before adding the click listener
    }

    setPopupWidth(width) {
        this._formContainer.style.width = `${width}px`;
    }

    formContainer() {
        const div = document.createElement('div');
        div.className = 'popup-form';

        // Set styles directly using the style property
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.background = 'transparent';
        //div.style.border = '1px solid #ccc';
        //div.style.padding = '10px';
        //div.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        div.style.justifyContent = 'start';
        div.style.alignItems = 'center';
        //div.style.minWidth = '30%';

        div.style.zIndex = '1001';

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

        return header;
    }

    html(content) {
        // Clear the form container before appending new elements
        while (this._formContainer.firstChild) {
            this._formContainer.removeChild(this._formContainer.firstChild);
        }

        this._formContainer.appendChild(this.formHeader());
        this._formContainer.appendChild(content);
    }

    closeForm() {
        console.log('form cancel clicked');
        console.log('Hiding form');
        if (this.popup) {
            this.popup._map.closePopup(this.popup); // Close the popup using the map instance
        }
        if (this.popupForm) {
            this.popupForm.remove();
        }
    }
}



class ImageCropper {
  constructor(imageElement, onCropCallback = null) {
      this.imageElement = imageElement;
      this.onCropCallback = onCropCallback;
      this.cropper = null;

      // Create a container for the cropping interface
      this.cropContainer = document.createElement('div');
      this.cropContainer.style.position = 'absolute';
      this.cropContainer.style.display = 'none';
      this.cropContainer.style.zIndex = '1000';
      
      // Append crop container to the parent of imageElement
      this.imageElement.parentNode.appendChild(this.cropContainer);

      // Create an image element for Cropper.js
      this.cropImageElement = document.createElement('img');
      this.cropContainer.appendChild(this.cropImageElement);

      // Create buttons for cropping actions
      this.createButtons();
  }

  initializeCropper() {
      this.cropper = new Cropper(this.cropImageElement, {
          aspectRatio: NaN, // Allow free cropping
          viewMode: 1,
          autoCropArea: 1,
      });
  }

  createButtons() {
      // Create a container for the buttons
      this.buttonContainer = document.createElement('div');
      this.buttonContainer.style.position = 'absolute';
      this.buttonContainer.style.top = '10px';
      this.buttonContainer.style.left = '10px';
      this.buttonContainer.style.display = 'flex';
      this.buttonContainer.style.gap = '10px';
      this.cropContainer.appendChild(this.buttonContainer);

      // Create a crop button
      this.cropButton = document.createElement('button');
      this.cropButton.innerText = 'Cortar';
      this.cropButton.addEventListener('click', () => this.crop());
      this.buttonContainer.appendChild(this.cropButton);

      // Create a cancel button
      this.cancelButton = document.createElement('button');
      this.cancelButton.innerText = 'Cancelar';
      this.cancelButton.addEventListener('click', () => this.cancel());
      this.buttonContainer.appendChild(this.cancelButton);
  }

  startCropping() {
      // Set the source of the crop image element to the original image
      this.cropImageElement.src = this.imageElement.src;

      // Position the crop container exactly over the image element
      const rect = this.imageElement.getBoundingClientRect();
      const parentRect = this.imageElement.parentNode.getBoundingClientRect();
      
      this.cropContainer.style.top = `${rect.top - parentRect.top}px`;
      this.cropContainer.style.left = `${rect.left - parentRect.left}px`;
      this.cropContainer.style.width = `${rect.width}px`;
      this.cropContainer.style.height = `${rect.height}px`;

      this.cropContainer.style.display = 'block';

      if (!this.cropper) {
          this.initializeCropper();
      } else {
          this.cropper.replace(this.imageElement.src);
      }
  }

  async crop() {
      const croppedCanvas = this.cropper.getCroppedCanvas();

      // Resize the cropped image to have a fixed height of 80px while maintaining proportions
      const resizedCanvas = document.createElement('canvas');
      const ctx = resizedCanvas.getContext('2d');
      const height = 80;
      const width = (croppedCanvas.width / croppedCanvas.height) * 80;
      
      resizedCanvas.width = width;
      resizedCanvas.height = height;
      ctx.drawImage(croppedCanvas, 0, 0, width, height);

      const resizedImageURL = resizedCanvas.toDataURL();
      this.imageElement.src = resizedImageURL;

      // Hide the cropping interface
      this.cropContainer.style.display = 'none';

      // Execute the callback if provided
      if (this.onCropCallback) {
          await this.onCropCallback(resizedImageURL);
      }
  }

  cancel() {
      // Hide the cropping interface without making changes
      this.cropContainer.style.display = 'none';
  }
}
