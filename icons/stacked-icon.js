class StackedIcon {
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

        // Create FontAwesome stacked icon element
        const spanElement = document.createElement('span');
        spanElement.className = 'fa-stack fa-lg';

        const circleIcon = document.createElement('i');
        circleIcon.className = 'fa fa-circle fa-stack-2x';
        circleIcon.style.color = this.isSelected ? 'green' : (this.isVisited ? 'blue' : this.color);
        circleIcon.style.opacity = this.isSelected ? '0.8' : this.opacity;

        const flagIcon = document.createElement('i');
        flagIcon.className = 'fa fa-building fa-stack-1x fa-inverse';

        // Append icons to span
        spanElement.appendChild(circleIcon);
        spanElement.appendChild(flagIcon);

        // Create span for the marker name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'marker-name';
        nameSpan.style.position = 'absolute';
        nameSpan.style.top = '-18px';
        nameSpan.style.transform = 'translateX(10%)';
        nameSpan.style.whiteSpace = 'nowrap';
        nameSpan.style.color = 'blue';
        nameSpan.style.display = 'block';
        nameSpan.innerText = this.name;

        // Append stacked icon and name span to container
        container.appendChild(spanElement);
        container.appendChild(nameSpan);

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
console.log('zoom', zoomLevel)
        const nameSpan = container.querySelector('.marker-name');
        if (zoomLevel > 15) {
            nameSpan.style.display = 'block';
        } else {
            nameSpan.style.display = 'none';
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

        const circleIcon = container.querySelector('.fa-circle');
        circleIcon.style.color = isSelected ? 'green' : (isVisited ? 'blue' : this.color);
        circleIcon.style.opacity = isSelected ? '0.8' : this.opacity;

        console.log('updating mark', isSelected, container.innerHTML);
        // Update the icon's HTML with the new color settings
        this.element = L.divIcon({
            html: container.innerHTML,
            className: ''
        });
    }
}
