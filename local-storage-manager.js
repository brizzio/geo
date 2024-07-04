class LocalStorageManager {
    constructor(storageKey, initialValue = {}) {
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
        console.log('setStoreData', this.storageKey, data)
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
        console.log('addItem', this.storageKey, newItem)
        let data = this.getStoredData();
        console.log('addItem data', data)
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

    // Clear all items from local storage
    clearAllItems() {
        localStorage.removeItem(this.storageKey);
    }
}

/* // Example usage:
const arrayStorage = new LocalStorageManager('arrayStorageKey', []);
const objectStorage = new LocalStorageManager('objectStorageKey', {});

// Testing with an array of objects
console.log('Testing with an array of objects:');
arrayStorage.clearAllItems();
arrayStorage.addItem({ id: '1', name: 'Item 1' });
arrayStorage.addItem({ id: '2', name: 'Item 2' });
console.log('All items:', arrayStorage.getAllItems());
console.log('Get item 1:', arrayStorage.getItem('1'));
arrayStorage.updateItem('1', { name: 'Updated Item 1', description: 'New Description' });
console.log('All items after update:', arrayStorage.getAllItems());
arrayStorage.deleteItem('2');
console.log('All items after delete:', arrayStorage.getAllItems());

// Testing with an object
console.log('\nTesting with an object:');
objectStorage.clearAllItems();
objectStorage.setStoredData({}); // Initialize as an object
objectStorage.addItem({ key: '1', value: 'Item 1' });
objectStorage.addItem({ key: '2', value: 'Item 2' });
console.log('All items:', objectStorage.getAllItems());
console.log('Get item 1:', objectStorage.getItem('1'));
objectStorage.updateItem('1', { value: 'Updated Item 1' });
console.log('All items after update:', objectStorage.getAllItems());
objectStorage.deleteItem('2');
console.log('All items after delete:', objectStorage.getAllItems()); */
