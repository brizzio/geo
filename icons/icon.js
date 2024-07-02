class Icon {
    constructor(name, iconUrl) {
        this.name = name;
        this.iconUrl = iconUrl || 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
        this.element = this.createIconElement();
        console.log(this)
    }

    createIconElement() {
        // Create container div
        const container = document.createElement('div');
        container.className = 'custom-marker';
        container.style.position = 'relative';

        // Create FontAwesome icon element
        const iconElement = document.createElement('i');
        iconElement.className = 'fas fa-building';
        iconElement.style.fontSize = '22px';
        iconElement.style.color = 'black';

        // Create span for the marker name
        const spanElement = document.createElement('span');
        spanElement.className = 'marker-name';
        spanElement.style.position = 'absolute';
        spanElement.style.top = '-18px';
        //spanElement.style.left = '20%';
        spanElement.style.transform = 'translateX(10%)';
        spanElement.style.whiteSpace = 'nowrap';
        spanElement.style.color = 'blue';
        spanElement.style.display = 'block';
        spanElement.innerText = this.name;

        // Append icon and span to container
        container.appendChild(iconElement);
        container.appendChild(spanElement);

        // Return L.divIcon with HTML from container
        return L.divIcon({
            html: container.outerHTML,
            className: '' // Clear the default class to avoid unwanted styles
        });
    }

    updateVisibility(map) {
        const zoomLevel = map.getZoom();
        const container = document.createElement('div');
        container.innerHTML = this.element.options.html;
        
        const span = container.querySelector('.marker-name');
        if (zoomLevel > 7) {
            span.style.display = 'block';
        } else {
            span.style.display = 'none';
        }

        // Update the icon's HTML with the new visibility settings
        this.element = L.divIcon({
            html: container.innerHTML,
            className: ''
        });
    }
}