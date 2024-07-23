/* // Create a new collection
const myCollection = new Collection('myTable');

// Create new items
const item1 = myCollection.create({ name: 'Item 1', description: 'This is item 1' });
const item2 = myCollection.create({ name: 'Item 2', description: 'This is item 2' });

console.log('Created Items:', item1, item2);

// Read an item
const readItem = myCollection.read(item1.id);
console.log('Read Item:', readItem);

// Update an item
const updatedItem = myCollection.update(item1.id, { description: 'Updated description for item 1' });
console.log('Updated Item:', updatedItem);

// Delete an item
const deletedItem = myCollection.delete(item2.id);
console.log('Deleted Item:', deletedItem);

// Get all items
const allItems = myCollection.getAll();
console.log('All Items:', allItems);

// Find items by property
const foundItems = myCollection.findBy('name', 'Item 1');
console.log('Found Items by Name:', foundItems);
Explanation
Load Data: The loadData method reads data from local storage when the Collection class is instantiated or when the table name is set.
Save Data: The saveData method writes the current state of the data array to local storage.
CRUD Operations: All CRUD operations (create, read, update, delete) call saveData after modifying the data array to ensure the changes are saved to local storage.
Usage: The usage example demonstrates how to use the updated Collection class with local storage functionality.
 */

class Collection {
    constructor(name) {
        this._id = name;
        this.data = this.loadData() || [];
    }

    

    // Load data from localStorage
    loadData() {
        const storedData = localStorage.getItem(this._id);
        return storedData ? JSON.parse(storedData) : [];
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem(this._id, JSON.stringify(this.data));
    }

    // Create
    create(item) {
        if (!item.id) {
            item.id = this.generateId();
        }
        this.data.push(item);
        this.saveData();
        return item;
    }

    // Read
    read(id) {
        return this.data.find(item => item.id == id);
    }

    // Update
    update(id, updatedItem) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updatedItem };
            this.saveData();
            return this.data[index];
        }
        return null;
    }

    // Delete
    remove(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            const [deletedItem] = this.data.splice(index, 1);
            this.saveData();
            return deletedItem;
        }
        return null;
    }

    // Generate a unique ID
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get all items
    getAll() {
        return this.data;
    }

    // Find by property
    findBy(property, value) {
        return this.data.filter(item => item[property] === value);
    }

   
}
