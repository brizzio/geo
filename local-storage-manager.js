class LocalStorageManager {
    constructor(storageKey, initialValue = null) {
        this.storageKey = storageKey;
        this.initialValue = initialValue;
        /* // Initialize storage if it doesn't exist
        if (!localStorage.getItem(this.storageKey)) {
            this.setStoredData(this.initialValue);
        } */
    }

    // Helper method to get the stored data
    getStoredData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : this.initialValue;
    }

    // Helper method to set the stored data
    setStoredData(data) {
       // console.log('setStoreData', this.storageKey, data)
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // Get all items from local storage
    getAllItems() {
        return this.getStoredData();
    }

    // Get a specific item by its key or id
    getItem(keyOrId) {
        const data = this.getStoredData();
        if (Array.isArray(data)) {
            return data.find(item => item.id === keyOrId);
        } else if (data && typeof data === 'object') {
            return data[keyOrId];
        }
        return null;
    }

    // Add a new item to local storage
    addItem(newItem) {
        //console.log('addItem', this.storageKey, newItem)
        let data = this.getStoredData();
        //console.log('addItem data', data)
        if (Array.isArray(data)) {
            data.push(newItem);
        } else if (data && typeof data === 'object') {
            data[newItem.key] = newItem.value;
        } else {
            // Initialize storage as an array or object if it doesn't exist
            data = Array.isArray(newItem) ? [newItem] : { [newItem.key]: newItem.value };
        }
        this.setStoredData(data);
    }

    // Update an existing item in local storage
    updateItem(id, updateObject) {
        let data = this.getStoredData();
        if (Array.isArray(data)) {
            const index = data.findIndex(item => item.id === id);
            if (index !== -1) {
                data[index] = { ...data[index], ...updateObject };
            } else {
                console.error(`Item with id ${id} not found.`);
            }
        } else if (data && typeof data === 'object') {
            if (data[id]) {
                data[id] = { ...data[id], ...updateObject };
            } else {
                console.error(`Item with key ${id} not found.`);
            }
        }
        this.setStoredData(data);
    }

    // Update an existing item in local storage
    updateItemProperty(searchKey, lookupValue, updateKey, updateValue) {
        let data = this.getStoredData();
        const index = data.findIndex(item => item[searchKey] === lookupValue);
        if (index !== -1) {
            data[index] = { ...data[index], [updateKey]:updateValue };
        } else {
            console.error(`Item with ${searchKey}= ${lookupValue}not found.`);
        }
        
        this.setStoredData(data);
    }


    find(key, value) {
        let data = this.getStoredData();
        const index = data.findIndex(item => item[key] === value);
            if (index !== -1) {
                return index
            } else {
                return null
            }
        
    }

    // Delete an item from local storage
    deleteItem(id) {
        let data = this.getStoredData();
        if (Array.isArray(data)) {
            data = data.filter(item => item.id !== id);
        } else if (data && typeof data === 'object') {
            delete data[id];
        }
        this.setStoredData(data);
    }

    // Delete an item from local storage
    deleteObjectFromArray(onKey, atValue) {
        console.log('deleteObjectFromArray', onKey, atValue)
        let data = this.getStoredData();
        if (Array.isArray(data)) {
            data = data.filter(item => item[onKey] !== atValue);
        }
        this.setStoredData(data);
    }

    // Delete an item from an array by indexlocal storage
    removeByIndex(index) {
        let storage = this.getStoredData();
        
        if (Array.isArray(storage)) {
            if (index >= 0 && index < storage.length) {
                storage.splice(index, 1);
            }
        }

        this.setStoredData(storage);
    }


    // Clear all items from local storage
    clearAllItems() {
        localStorage.removeItem(this.storageKey);
    }
}


