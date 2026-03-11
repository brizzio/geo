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
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';

        // Use a plain styled dot so marker rendering does not depend on icon fonts.
        const iconElement = document.createElement('span');
        iconElement.className = 'marker-dot';
        iconElement.style.display = 'inline-block';
        iconElement.style.width = '16px';
        iconElement.style.height = '16px';
        iconElement.style.borderRadius = '50%';
        iconElement.style.border = '2px solid #fff';
        iconElement.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.25)';
        iconElement.style.backgroundColor = this.isSelected ? 'green' : (this.isVisited ? 'blue' : this.color);
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

        const iconElement = container.querySelector('.marker-dot');
        iconElement.style.backgroundColor = isSelected ? 'green' : (isVisited ? 'blue' : this.color);
        iconElement.style.opacity = isSelected ? '0.8' : this.opacity;

        //console.log('updating mark', isSelected, container.innerHTML);
        // Update the icon's HTML with the new color settings
        this.element = L.divIcon({
            html: container.innerHTML,
            className: ''
        });
    }
}

if (typeof window !== 'undefined') {
  window.SearchMarkIcon = SearchMarkIcon;
}



