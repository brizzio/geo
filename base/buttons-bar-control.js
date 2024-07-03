class ButtonsBar extends L.Control {
    constructor(buttons, options = {}) {
        super(options);
        this.buttons = buttons;

        // Inject styles directly into the control
        const style = document.createElement('style');
        style.id='buttons-bar-styles'
        style.innerHTML = `
        .buttons-bar {
            display: flex;
            align-items: center;
            padding: 10px;
            background-color: rgba(255, 255, 255, 0.4); /* 40% opacity white */
            border-radius: 5px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        
        .buttons-bar button {
            padding: 5px 10px;
            margin-right: 5px;
            background-color: #444; /* Dark gray background */
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        .buttons-bar button:hover {
            background-color: #333; /* Darker shade on hover */
        }
        
    `;
    
        document.head.appendChild(style);
    }

    

    onAdd(map) {
        var container = L.DomUtil.create('div', 'buttons-bar p-4 bg-white bg-opacity-40 rounded shadow-lg');

        // Prevent clicks on the control from propagating to the map
        L.DomEvent.disableClickPropagation(container);

        // Create the buttons
        this.buttons.forEach(button => {
            var btn = L.DomUtil.create('button', 'block w-full mb-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600', container);
            btn.innerHTML = button.text;
            btn.onclick = button.onClick;
        });

        return container;
    }
}