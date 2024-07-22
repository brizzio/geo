class SearchMarkIcon {
    constructor(name) {
        this.name = name;
        this.isSelected = false;
        this.isVisited = false;
        this.color = '#484c4c'; // default color
        this.opacity = 0.5;
        this.element = this.createIconElement();
    }

    createIconElement() {
        // Create container div
        const container = document.createElement('div');
        container.className = 'custom-marker';
        container.style.position = 'relative';

        // Create FontAwesome icon element
        const iconElement = document.createElement('i');
        iconElement.className = 'fas fa-circle';
        iconElement.style.fontSize = '22px';
        iconElement.style.color = this.isSelected ? 'green' : (this.isVisited ? 'blue' : this.color);
        iconElement.style.opacity = this.isSelected ? '0.8' : this.opacity;

        // Create span for the marker name
        const spanElement = document.createElement('span');
        spanElement.className = 'marker-name';
        spanElement.style.position = 'absolute';
        spanElement.style.top = '-18px';
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
        if (zoomLevel > 18) {
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

    setSelected(isSelected, isVisited) {
        this.isSelected = isSelected;
        this.isVisited = isVisited;
        const container = document.createElement('div');
        container.innerHTML = this.element.options.html;

        const iconElement = container.querySelector('i');
        iconElement.style.color = isSelected ? 'green' : (isVisited ? 'blue' : this.color);
        iconElement.style.opacity = isSelected ? '0.8' : this.opacity;

        //console.log('updating mark', isSelected, container.innerHTML);
        // Update the icon's HTML with the new color settings
        this.element = L.divIcon({
            html: container.innerHTML,
            className: ''
        });
    }
}