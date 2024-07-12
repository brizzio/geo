class ImageEditor {
    constructor() {
        this.init();
    }

    init() {
        this.createForm();
        this.addEventListeners();
    }

    createForm() {
        const style = document.createElement('style');
        style.textContent = `
            #image-editor-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                overflow: hidden;
            }
            #image-editor-form {
                position: relative;
                background: white;
                padding: 30px;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                max-width: 90%;
                max-height: 90%;
            }
            #image-editor-form input, #image-editor-form textarea, #image-editor-form button {
                margin: 10px 0;
                width: 100%;
            }
            #image-preview-container {
                position: relative;
                width: 100%;
                height: 180px;
                margin: 20px 0;
                overflow: hidden;
            }
            #image-preview {
                width: auto;
                max-width: 100%;
                max-height: 180px; /* Ensures image doesn't exceed 180px in height */
                display: block;
            }
            #image-dimensions {
                position: absolute;
                bottom: 5px;
                left: 5px;
                color: white;
                font-size: 14px;
                background: rgba(0, 0, 0, 0.6);
                padding: 5px;
                border-radius: 3px;
                display: none;
            }
            #crop-resize-controls {
                display: flex;
                justify-content: space-between;
                width: 100%;
            }
            #close-button {
                position: absolute;
                top: -7px;
                right: -153px;
                background: transparent;
                border: none;
                font-size: 30px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);

        const formHtml = `
            <div id="image-editor-overlay">
                <form id="image-editor-form">
                    <button type="button" id="close-button">&times;</button>
                    <input type="file" id="image-upload" accept="image/*">
                    <textarea id="image-url" placeholder="Paste image URL here"></textarea>
                    <div id="crop-resize-controls">
                        <button type="button" id="crop-image">Crop</button>
                        <button type="button" id="resize-image">Resize</button>
                    </div>
                    <div id="image-preview-container">
                        <img id="image-preview" src="" alt="Image Preview">
                        <div id="image-dimensions"></div>
                    </div>
                </form>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', formHtml);
    }

    addEventListeners() {
        document.getElementById('image-upload').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('image-preview').src = e.target.result;
                    this.initCropper(file.name); // Pass filename to initCropper
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('image-url').addEventListener('change', (event) => {
            const url = event.target.value;
            document.getElementById('image-preview').src = url;
            // Generate a unique key for image URL based saving
            this.initCropper(this.generateUniqueKey());
        });

        document.getElementById('crop-image').addEventListener('click', () => this.cropImage());
        document.getElementById('resize-image').addEventListener('click', () => this.resizeImage());
        document.getElementById('close-button').addEventListener('click', () => this.closeForm());
    }

    initCropper(key) {
        if (this.cropper) {
            this.cropper.destroy();
        }
        const image = document.getElementById('image-preview');
        this.cropper = new Cropper(image, {
            aspectRatio: NaN,
            viewMode: 1,
            autoCropArea: 0.5,
            responsive: true,
            background: false,
            ready: () => {
                const cropBoxData = this.cropper.getCropBoxData();
                this.updateDimensions(cropBoxData.width, cropBoxData.height);
            },
            crop: (event) => {
                this.updateDimensions(event.detail.width, event.detail.height);
            }
        });
        this.currentKey = key; // Store current key for saving later
    }

    updateDimensions(width, height) {
        const dimensionsElement = document.getElementById('image-dimensions');
        dimensionsElement.textContent = `${Math.round(width)} x ${Math.round(height)} px`;
        dimensionsElement.style.display = 'block';
    }

    cropImage() {
        const image = document.getElementById('image-preview');
        const canvas = this.cropper.getCroppedCanvas();
        
        canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Data = reader.result.split(',')[1]; // Get base64 data
                this.saveToLocalStorage(this.currentKey, base64Data);
            };
            reader.readAsDataURL(blob);
        });
        this.cropper.destroy();
        image.src = canvas.toDataURL();
        document.getElementById('image-dimensions').style.display = 'none';
    }

    resizeImage() {
        const image = document.getElementById('image-preview');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        console.log('resizing...', image.width, image.height);
    
        const scaleFactor = 80 / image.height;
        canvas.width = image.width * scaleFactor;
        canvas.height = 80;
    
        // Clear canvas to ensure transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
        const resizedBase64 = canvas.toDataURL('image/png'); // Adjust format if needed
    
        image.src = resizedBase64;
        console.log('resized...', canvas.width, canvas.height);
    
        this.updateDimensions(canvas.width, canvas.height);
        this.saveToLocalStorage(this.currentKey, resizedBase64.split(',')[1]); // Save resized image to local storage
    }

    saveToLocalStorage(key, value) {
        const images = JSON.parse(localStorage.getItem('croppedImages')) || {};
        images[key] = value;
        localStorage.setItem('croppedImages', JSON.stringify(images));
        alert('Image saved to local storage!');
    }

    closeForm() {
        const overlay = document.getElementById('image-editor-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    generateUniqueKey() {
        return Math.random().toString(36).substring(7); // Generates a random key
    }
}


