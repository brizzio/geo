class ProductAttributesModel {
    constructor(data={}, language='pt-BR') {
        
      this._language = language; // Use a different property to store the language
      // Define the attributes and their options in different languages
      this._attributes = [
        {
            id: 'typesOfPresentation',
            field: 'types_of_presentation',
            options: {
                en: ['Single', 'Pack', 'Bundle', 'Kit', 'Set'],
                es: ['Individual', 'Paquete', 'Conjunto', 'Kit', 'Juego'],
                pt_BR: ['Único', 'Pacote', 'Pacote', 'Kit', 'Conjunto']
            }
        },
        {
            id: 'packaging',
            field: 'packaging',
            options: {
                en: ['Box', 'Bag', 'Bottle', 'Can', 'Wrapper'],
                es: ['Caja', 'Bolsa', 'Botella', 'Lata', 'Envase'],
                pt_BR: ['Caixa', 'Saco', 'Garrafa', 'Lata', 'Embalagem']
            }
        },
        {
            id: 'shelfUnit',
            field: 'shelf_unit',
            options: {
                en: ['Shelf', 'Display', 'Rack', 'Stand'],
                es: ['Estante', 'Expositor', 'Rack', 'Soporte'],
                pt_BR: ['Prateleira', 'Expositor', 'Rack', 'Suporte']
            }
        },
        {
            id: 'sizes',
            field: 'sizes',
            options: {
                en: ['Small', 'Medium', 'Large', 'Extra Large'],
                es: ['Pequeño', 'Mediano', 'Grande', 'Extra Grande'],
                pt_BR: ['Pequeno', 'Médio', 'Grande', 'Extra Grande']
            }
        },
        {
            id: 'colors',
            field: 'colors',
            options: {
                en: ['Red', 'Blue', 'Green', 'Yellow', 'Black'],
                es: ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Negro'],
                pt_BR: ['Vermelho', 'Azul', 'Verde', 'Amarelo', 'Preto']
            }
        }
        // Add other attributes here
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


  /**
   * 
   * // Example usage
const attributes = new ProductAttributes();

// Get default options
console.log('Types of Presentation:', attributes.typesOfPresentation);
console.log('Packaging:', attributes.packaging);

// Change language
attributes.language = 'es';

// Get options in the new language
console.log('Tipos de Presentación:', attributes.typesOfPresentation);
console.log('Empaque:', attributes.packaging);

// Add a new attribute with options
attributes.addAttribute('materials', ['Plastic', 'Glass', 'Metal'], 'en');
attributes.addAttribute('materiales', ['Plástico', 'Vidrio', 'Metal'], 'es');

// Get new attribute options
console.log('Materials:', attributes.getAttributeOptions('materials'));
console.log('Materiales:', attributes.getAttributeOptions('materiales'));

   */