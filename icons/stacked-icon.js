class StackedIcon {
    constructor(htmlTitle, face, selected, visited) {
        console.log('face', face)
        this.htmlTitle = htmlTitle;
        this.isSelected = selected;
        this.isVisited = visited;
        this.color = '#484c4c'; // default color
        this.opacity = 0.5;
        this._faIconClassName=face
        this.element = this.createIconElement();
        
    }

    get faceIcon(){
        return this._faIconClassName 
    }

    set faceIcon(faicon){
        this._faIconClassName = faicon
    }

    setTitle(newHtmlTitle) {
        this.htmlTitle = newHtmlTitle;
        this.element= this.createIconElement();
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
        circleIcon.className = 'fa fa-circle fa-md fa-stack-2x';
        circleIcon.style.color = this.isSelected ? 'green' : (this.isVisited ? 'green' : this.color);
        circleIcon.style.opacity = this.isSelected ? '0.8' : (this.isVisited ? '0.5' : this.opacity);

        const flagIcon = document.createElement('i');
        flagIcon.className = `fa ${this.faceIcon} fa-md fa-stack-1x fa-inverse`;

        // Append icons to span
        spanElement.appendChild(circleIcon);
        spanElement.appendChild(flagIcon);

        // Create span for the marker name
        const titleDiv = document.createElement('div');
        titleDiv.className = 'marker-name';
        titleDiv.style.whiteSpace = 'nowrap';
        titleDiv.style.color = 'blue';
        titleDiv.style.display = 'block';
        titleDiv.innerHTML = this.htmlTitle;

        // Append stacked icon and name span to container
        container.appendChild(titleDiv);
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
console.log('zoom', zoomLevel)
        const nameSpan = container.querySelector('.marker-name');
        if (zoomLevel > 10) {
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
        circleIcon.style.color = isSelected ? 'green' : (isVisited ? 'green' : this.color);
        circleIcon.style.opacity = isSelected ? '0.8' : (isVisited ? '0.5' : this.opacity);

        //console.log('updating mark', isSelected, container.innerHTML);
        // Update the icon's HTML with the new color settings
        this.element = L.divIcon({
            html: container.innerHTML,
            className: ''
        });
    }
}
