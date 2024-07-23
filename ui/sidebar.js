class Sidebar {
    constructor(origin = 'left', widthPercentage = 50) {
        this.origin = origin; // Store the origin
        this.widthPercentage = widthPercentage; // Store the width percentage
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
            justify-content: ${this.origin === 'left' ? 'start' : 'end'}; /* Align based on origin */
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
            padding: 10px;
            display: flex;
            flex-direction: column;
            justify-content: start;
            align-items: center;
            width: ${this.widthPercentage}vw; /* Set width based on percentage */
            height: 100%;
            transform: translateX(${this.origin === 'left' ? '-100%' : '100%'}); /* Start off-screen based on origin */
            transition: transform 0.5s ease-in-out; /* Animation */
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            border-radius: ${this.origin === 'left' ? '0 10px 10px 0' : '10px 0 0 10px'}; /* Rounded corners based on origin */
        `;
        return div;
    }

    header() {
        const header = document.createElement('div');
        header.style.cssText = `
            
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

        
        

        return header;
    }

    show(content) {
        // Clear the sidebar before appending new elements
        while (this._container.firstChild) {
            this._container.removeChild(this._container.firstChild);
        }

        this._container.appendChild(this.cancelButtonElement());
        this._container.appendChild(this.header());
        this._container.appendChild(content);
        this._overlay.appendChild(this._container);
        document.body.appendChild(this._overlay);

        // Trigger the slide-in animation
        requestAnimationFrame(() => {
            this._container.style.transform = 'translateX(0)';
        });
    }

    cancelButtonElement() {
        let btn = document.createElement('span');
        btn.innerHTML = `<i class="fa fa-times" aria-hidden="true"></i>`;
        btn.style.cssText = `
            position: absolute;
            padding: 0;
            margin: 0;
            top: 10px;
            right: 10px;
            width: 10px;
            background: transparent;
            border: none;
            cursor: pointer;
            z-index: 9999,
        `;

        btn.addEventListener('click', this.close.bind(this));
        return btn;
    }

    close() {
        console.log('closing sidebar ...');
        this._overlay.style.transform = `translateX(${this.origin === 'left' ? '-100%' : '100%'})`; // Slide out based on origin
        setTimeout(() => {
            this._overlay && this._overlay.remove();
        }, 500); // Wait for the animation to finish before removing
    }
}
