class PopupDynamicForm {
    constructor(inputs, onSave, onCancel) {
        this.inputs = inputs;
        this.onSave = onSave;
        this.onCancel = onCancel;
        this.form = null;
        this.popup = null;
        this.formElements = {}; // To store form elements for access later
    }

    show(latlng, map) {
        console.log('Showing form at latlng:', latlng);
        this.popup = L.popup()
            .setLatLng(latlng)
            .setContent(this.createForm())
            .openOn(map);

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

    createForm() {
        console.log('Creating form with inputs:', this.inputs);
        const form = document.createElement('div');
        form.className = 'dynamic-form';

        // Set styles directly using the style property
        form.style.background = 'white';
        form.style.border = '1px solid #ccc';
        form.style.padding = '10px';
        form.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        form.style.zIndex = '1001';

        this.inputs.forEach(input => {
            const fieldContainer = document.createElement('div');
            fieldContainer.style.marginBottom = '10px';

            const label = document.createElement('label');
            label.innerText = input.label;
            label.style.display = 'block';
            label.style.marginBottom = '5px';
            fieldContainer.appendChild(label);

            const field = document.createElement('input');
            field.type = input.type === 'image_url' ? 'text' : input.type;
            field.placeholder = input.placeholder;
            field.style.display = 'block';
            field.style.marginBottom = '5px';
            field.style.padding = '5px';
            field.style.width = '100%';
            field.style.boxSizing = 'border-box';
            fieldContainer.appendChild(field);

            if (input.type === 'image_url') {
                const imgPreview = document.createElement('img');
                imgPreview.style.display = 'none';
                imgPreview.style.maxWidth = '100%';
                imgPreview.style.marginTop = '5px';
                fieldContainer.appendChild(imgPreview);

                field.addEventListener('change', () => {
                    const url = field.value.trim();
                    console.log('image', url)
                    if (url) {
                        imgPreview.src = url;
                        imgPreview.style.display = 'block';
                        field.style.display = 'none';
                    } else {
                        imgPreview.style.display = 'none';
                    }
                });

                this.formElements[input.field] = { field, imgPreview };
            } else {
                this.formElements[input.field] = { field };
            }

            form.appendChild(fieldContainer);
        });

        const saveButton = document.createElement('button');
        saveButton.innerText = 'Save';
        saveButton.style.display = 'block';
        saveButton.style.marginBottom = '5px';
        saveButton.style.padding = '5px';
        saveButton.style.width = '100%';
        saveButton.style.boxSizing = 'border-box';
        saveButton.addEventListener('click', () => {
            const formData = {};
            this.inputs.forEach(input => {
                formData[input.field] = this.formElements[input.field].field.value;
            });
            this.onSave(formData);
            this.hide();
        });
        form.appendChild(saveButton);

        const cancelButton = document.createElement('button');
        cancelButton.innerText = 'Cancel';
        cancelButton.style.display = 'block';
        cancelButton.style.marginBottom = '5px';
        cancelButton.style.padding = '5px';
        cancelButton.style.width = '100%';
        cancelButton.style.boxSizing = 'border-box';
        cancelButton.addEventListener('click', () => {
            this.onCancel();
            this.hide();
        });
        form.appendChild(cancelButton);

        this.form = form;
        return form;
    }

    hide() {
        console.log('Hiding form');
        if (this.popup) {
            this.popup._map.closePopup(this.popup); // Close the popup using the map instance
        }
        if (this.form) {
            this.form.remove();
        }
    }
}