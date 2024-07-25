
class ProductMetadata {
      constructor(language = 'en') {
        this.language = language;
        // Define the product metadata attributes and their options in different languages
        this._attributes = [
              {
                  id: 'salesFrequency',
                  field: 'sales_frequency',
                  options: {
                      en: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
                      es: ['Diario', 'Semanal', 'Mensual', 'Anual'],
                      pt_BR: ['Diário', 'Semanal', 'Mensal', 'Anual']
                  }
              },
              {
                  id: 'seasonality',
                  field: 'seasonality',
                  options: {
                      en: ['None', 'Winter', 'Spring', 'Summer', 'Fall'],
                      es: ['Ninguno', 'Invierno', 'Primavera', 'Verano', 'Otoño'],
                      pt_BR: ['Nenhuma', 'Inverno', 'Primavera', 'Verão', 'Outono']
                  }
              },
              {
                  id: 'volume',
                  field: 'volume',
                  options: {
                      en: ['Low', 'Medium', 'High'],
                      es: ['Bajo', 'Medio', 'Alto'],
                      pt_BR: ['Baixo', 'Médio', 'Alto']
                  }
              },
              {
                  id: 'customerBase',
                  field: 'customer_base',
                  options: {
                      en: ['General', 'Targeted', 'Niche'],
                      es: ['General', 'Segmentado', 'De nicho'],
                      pt_BR: ['Geral', 'Segmentado', 'Nicho']
                  }
              },
              {
                  id: 'salesChannel',
                  field: 'sales_channel',
                  options: {
                      en: ['In-Store', 'Online', 'Both'],
                      es: ['En tienda', 'En línea', 'Ambos'],
                      pt_BR: ['Em loja', 'Online', 'Ambos']
                  }
              },
              {
                  id: 'profitMargin',
                  field: 'profit_margin',
                  options: {
                      en: ['Low', 'Medium', 'High'],
                      es: ['Bajo', 'Medio', 'Alto'],
                      pt_BR: ['Baixo', 'Médio', 'Alto']
                  }
              },
              {
                  id: 'marketing',
                  field: 'marketing',
                  options: {
                      en: ['Low', 'Medium', 'High'],
                      es: ['Bajo', 'Medio', 'Alto'],
                      pt_BR: ['Baixo', 'Médio', 'Alto']
                  }
              },
              {
                  id: 'distribution',
                  field: 'distribution',
                  options: {
                      en: ['Local', 'Regional', 'National', 'International'],
                      es: ['Local', 'Regional', 'Nacional', 'Internacional'],
                      pt_BR: ['Local', 'Regional', 'Nacional', 'Internacional']
                  }
              },
              {
                  id: 'category',
                  field: 'category',
                  options: {
                      en: ['Essential', 'Luxury', 'Convenience', 'Impulse'],
                      es: ['Esencial', 'Lujo', 'Conveniencia', 'Impulso'],
                      pt_BR: ['Essencial', 'Luxo', 'Conveniência', 'Impulso']
                  }
              },
              {
                  id: 'shelfLife',
                  field: 'shelf_life',
                  options: {
                      en: ['Short', 'Medium', 'Long'],
                      es: ['Corto', 'Medio', 'Largo'],
                      pt_BR: ['Curto', 'Médio', 'Longo']
                  }
              },
              {
                  id: 'brandStrength',
                  field: 'brand_strength',
                  options: {
                      en: ['Weak', 'Moderate', 'Strong'],
                      es: ['Débil', 'Moderado', 'Fuerte'],
                      pt_BR: ['Fraco', 'Moderado', 'Forte']
                  }
              },
              {
                  id: 'customerLoyalty',
                  field: 'customer_loyalty',
                  options: {
                      en: ['Low', 'Medium', 'High'],
                      es: ['Bajo', 'Medio', 'Alto'],
                      pt_BR: ['Baixo', 'Médio', 'Alto']
                  }
              }
              // Add other metadata attributes here
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
  
  
      // Classify a single product based on provided metadata
      classifyProduct(product) {
        const classification = {};
        for (const attribute of this._attributes) {
            if (product[attribute.field]) {
                classification[attribute.id] = product[attribute.field];
            }
        }
        return classification;
      }
  
      // Classify all products based on provided metadata
      classifyAllProducts(products) {
        return products.map(product => this.classifyProduct(product));
      }
  }


  
  
/* 


// Create a criteria manager and add new criteria
const criteriaManager = new ClassificationCriteria('es');
criteriaManager.addCriteria('newCriteria', ['option1', 'option2'], 'en');
criteriaManager.addCriteria('newCriteria', ['opción1', 'opción2'], 'es');

// Create ProductMetadata with the updated criteria
const productMetadata = new ProductMetadata(products, criteriaManager, 'es'); // Change 'es' to desired language code
const classifiedProducts = productMetadata.classifyAllProducts();

console.log(classifiedProducts);



Sales Volume:

High Volume: Products that sell in large quantities.
Medium Volume: Products with moderate sales quantities.
Low Volume: Products with relatively low sales quantities.
Sales Frequency:

Daily: Products purchased on a daily basis.
Weekly: Products purchased on a weekly basis.
Monthly: Products purchased on a monthly basis.
Occasional: Products purchased irregularly.
Seasonality:

Seasonal: Products with sales peaks during specific seasons or holidays.
Non-Seasonal: Products with consistent sales throughout the year.
Customer Demographics:

Age Group: Products targeted at specific age groups (e.g., children, teenagers, adults, seniors).
Gender: Products targeted at specific genders.
Income Level: Products targeted at specific income levels (e.g., luxury items, budget items).
Geographical Region:

Local: Products sold predominantly in a local area.
Regional: Products sold across a larger region.
National: Products sold nationwide.
International: Products sold globally.
Product Lifecycle Stage:

Introduction: Newly launched products.
Growth: Products experiencing rapid sales growth.
Maturity: Products with stable sales.
Decline: Products with decreasing sales.
Customer Loyalty:

High Loyalty: Products with a strong, repeat customer base.
Moderate Loyalty: Products with occasional repeat customers.
Low Loyalty: Products with few repeat customers.
Profit Margin:

High Margin: Products that generate high profits relative to their cost.
Medium Margin: Products with moderate profit margins.
Low Margin: Products with low profit margins.
Marketing and Promotion:

Heavily Promoted: Products that are frequently advertised or promoted.
Moderately Promoted: Products with occasional promotions.
Low Promotion: Products with minimal advertising.
Distribution Channel:

In-Store: Products sold in physical retail locations.
Online: Products sold through online platforms.
Multi-Channel: Products sold through both online and offline channels.
Product Category:

Essential: Products that are necessary for daily life (e.g., groceries).
Non-Essential: Products that are luxury or discretionary items.
Shelf Life:

Short Shelf Life: Perishable products with limited time before expiration.
Long Shelf Life: Non-perishable products that can be stored for extended periods.
Brand Strength:

Strong Brand: Products from well-known, trusted brands.
Moderate Brand: Products from moderately known brands.
Weak Brand: Products from lesser-known or new brands.

// Example usage
  const products = [
    {
      id: 1,
      name: 'Daily Bread',
      salesFrequency: 'daily',
      seasonality: 'none',
      volume: 'high',
      customerBase: 'general',
      salesChannel: 'in-store',
      profitMargin: 'low',
      marketing: 'low',
      distribution: 'local',
      category: 'essential',
      shelfLife: 'short',
      brandStrength: 'moderate',
      customerLoyalty: 'high'
    },
    {
      id: 2,
      name: 'Christmas Tree',
      salesFrequency: 'seasonal',
      seasonality: 'high',
      volume: 'high',
      customerBase: 'general',
      salesChannel: 'in-store/online',
      profitMargin: 'high',
      marketing: 'high',
      distribution: 'national',
      category: 'non-essential',
      shelfLife: 'long',
      brandStrength: 'strong',
      customerLoyalty: 'moderate'
    },
    // More products...
  ];
  
  const productMetadata = new ProductMetadata(products);
  const classifiedProducts = productMetadata.classifyAllProducts();
  
  console.log(classifiedProducts);
  

*/