class TaxonomyModel {
    constructor(data={}, language='pt-BR') {

    this._language = language;
    // Define the taxonomy attributes and their options in different languages
    this._attributes = [
        {
          id: 'department',
          internal_code:null,
          field: 'level_1',
          label:{
            en: 'department',
            pt_BR: 'departamento'
          },
          options: {
              en: ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Beverage'],
              es: ['Fruta', 'Verdura', 'Lácteo', 'Carne', 'Bebida'],
              pt_BR: ['Fruta', 'Legume', 'Laticínio', 'Carne', 'Bebida']
          }
        },
        {
          id: 'group',
          internal_code:null,
          field: 'level_1',
          label:{
            en: 'department',
            pt_BR: 'departamento'
          },
          options: {
              en: ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Beverage'],
              es: ['Fruta', 'Verdura', 'Lácteo', 'Carne', 'Bebida'],
              pt_BR: ['Fruta', 'Legume', 'Laticínio', 'Carne', 'Bebida']
          }
        },
        {
          id: 'subgroup',
          internal_code:null,
          field: 'level_1',
          label:{
            en: 'department',
            pt_BR: 'departamento'
          },
          options: {
              en: ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Beverage'],
              es: ['Fruta', 'Verdura', 'Lácteo', 'Carne', 'Bebida'],
              pt_BR: ['Fruta', 'Legume', 'Laticínio', 'Carne', 'Bebida']
          }
        },
        {
          id: 'category',
          internal_code:null,
          field: 'level_1',
          label:{
            en: 'department',
            pt_BR: 'departamento'
          },
          options: {
              en: ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Beverage'],
              es: ['Fruta', 'Verdura', 'Lácteo', 'Carne', 'Bebida'],
              pt_BR: ['Fruta', 'Legume', 'Laticínio', 'Carne', 'Bebida']
          }
        },
        {
          id: 'family',
          internal_code:null,
          field: 'level_1',
          label:{
            en: 'department',
            pt_BR: 'departamento'
          },
          options: {
              en: ['Fruit', 'Vegetable', 'Dairy', 'Meat', 'Beverage'],
              es: ['Fruta', 'Verdura', 'Lácteo', 'Carne', 'Bebida'],
              pt_BR: ['Fruta', 'Legume', 'Laticínio', 'Carne', 'Bebida']
          }
        },
            // Add other taxonomy attributes here
      ];
    }

    // Method to get the field for a given id
    getFieldForId(id) {
        const attribute = this._attributes.find(attr => attr.id === id);
        return attribute ? attribute.field : null;
    }

    // Find an attribute by its id
    _findAttribute(id) {
        return this._attributes.find(attr => attr.id === id);
    }

    // Get options for a specific attribute in the given language
    getOptions(id, lang = 'en') {
        const attribute = this._findAttribute(id);
        if (attribute) {
            return attribute.options[lang] || [];
        }
        return [];
    }

    // Set options for a specific attribute in the given language
    setOptions(id, lang, options) {
        const attribute = this._findAttribute(id);
        if (attribute) {
            attribute.options[lang] = options;
        }
    }

    // Add a new attribute with options
    addAttribute(id, field, options) {
        if (!this._findAttribute(id)) {
            this._attributes.push({
                id: id,
                field: field,
                options: options
            });
        }
    }
}

class Label{
  constructor(language='PT-br'){
    this._language = language

    this._labels={
      department:{
        en: 'department',
        pt_BR: 'departamento'
      },
      group:{
        en: 'division',
        pt_BR: 'grupo'
      },
      subGroup:{
        en: 'group',
        pt_BR: 'sub grupo'
      },
      category:{
        en: 'category',
        pt_BR: 'categoria'
      },
      family:{
        en: 'family',
        pt_BR: 'familia'
      },
    }
  }

  // Get label
  get(id) {
    const label = this._labels[id]
    if (label) {
        return label[this._language] || '';
    }
    return null;
  }

  // update label
  update(id, value) {
    const label = this._labels[id]
    if (label) {
        this._labels[id][this._language] = value;
    }
    return null;
  }


}

class TaxonomyItem{
  constructor(language='PT-br'){
    this._language = language
    this._collection = new Collection('taxonomies')
    this.id = null
    this._level_id = null
    this.code = null
    this.name = null
    this.description = null
    this.icon = null
    this.fields = {
      en: ['code', 'name', 'description', 'icon'],
      pt_BR: ['codigo', 'nome', 'descrição', 'icone']
    }

   
  }

  get data(){
    let obj = Object.assign({},this)
    for (const key in obj) {
      if (key.startsWith('_')) {
        delete obj[key];
      }
    }
    return obj;
  }

  set data(obj){
    Object.assign(this, obj)
  }
  // Get label
  get label() {
        return this.name
  }

  
  get level() {
    return this._level_id
  }

  // Method to generate an Excel download button
  generateDownloadButton() {
    const button = document.createElement('button');
    button.textContent = 'Download Estrutura Mercadológica';
    button.onclick = () => {
      this.downloadExcel();
    };
    return button;
  }

  // Method to download an Excel file with taxonomy data
  downloadExcel() {
    const workbook = XLSX.utils.book_new();
    const headers = this.fields['pt_BR'];
    const emptyRows = Array(90).fill(headers.map(() => ''));
    const data = [headers, ...emptyRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estrutura Mercadologica');
    XLSX.writeFile(workbook, 'estrutura_mercadologica.xlsx');
  }



}