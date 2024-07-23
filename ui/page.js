class Page {
    constructor() {
      this._overlay = this.overlay();
      this._container = this.container();
      this._header = this.header();
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
  
    container() {
      const div = document.createElement('div');
      div.style.cssText = `
        position: relative;
        background: white;
        padding-right: 10px;
        padding-left: 10px;
        display: flex;
        flex-direction: column;
        justify-content: start;
        align-items:center; 
        min-width:100%;
        min-height:100%;
      `;
      return div;
    }

    header() {
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
    
    show(content) {
      // Clear the page before appending new elements
      while (this._container.firstChild) {
        this._container.removeChild(this._container.firstChild);
      }
      

      this._container.appendChild(this.header());
      //let elements = this.formElementsContainer(content);
      this._container.appendChild(content);
      this._overlay.appendChild(this._container);
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
  
      btn.addEventListener('click', this.close.bind(this));
      return btn;
    }

  
    close() {
      console.log('closing page ...');
      this._overlay && this._overlay.remove();
    }

    
  }