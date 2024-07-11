class OptionForm {
    constructor(map, marker, options, onSelect) {
        this.map = map;
        this.marker = marker;
        this.options = options;
        this.onSelect = onSelect;
        this.#addStyles(); // Inject CSS styles
        this.formCloseHandler = this.hide.bind(this);
    }

    show() {
        // Create form container
        this.form = document.createElement('div');
        this.form.className = 'option-form-container';
        const title = document.createElement('h4');
        title.innerText = 'selecione a Matriz:';

        this.form.appendChild(title);
        // Create options buttons
        
        this.options.forEach((option, i) => {
            
            const button = document.createElement('button');
            button.innerText = option;
            button.addEventListener('click', () => {
                this.onSelect(option, i);
                this.hide();
            });
            this.form.appendChild(button);
            
        });

        // Append form to map's popup
        const popup = L.popup()
            .setLatLng(this.marker.getLatLng())
            .setContent(this.form)
            .openOn(this.map);

        this.map.on('popupclose', this.formCloseHandler);
    }

    hide() {
        if (this.form) {
            this.form.remove();
        }
        this.map.off('popupclose', this.formCloseHandler);
        this.#removeStyles();
    }

    #addStyles() {
        if (!document.getElementById('option-form-styles')) {
            const style = document.createElement('style');
            style.id = 'option-form-styles';
            style.innerHTML = `
                .option-form-container {
                    background: white;
                    border: 1px solid #ccc;
                    padding: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    z-index: 1001;
                }

                .option-form-container button {
                    display: block;
                    margin-bottom: 5px;
                    padding: 5px;
                    width: 100%;
                    box-sizing: border-box;
                }
            `;
            document.head.appendChild(style);
        }
    }

    #removeStyles() {
        const style = document.getElementById('option-form-styles');
        if (style) {
            style.remove();
        }
    }
}
