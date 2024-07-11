class StoreTypes{
    constructor(lang = 'pt-BR'){
      this.lang = lang
      this.data={
        supermarket: { 
          id: 1, 
          name: {
            "pt-BR": "Supermercado",
            "en-US": "Supermarket",
            "it_IT": "Supermercato"
          },
          description: { 
            "pt-BR": "Um supermercado é um estabelecimento que oferece uma ampla variedade de alimentos, produtos de higiene e limpeza, itens de cuidado pessoal e outros produtos para compra.",
            "en-US": "A supermarket is a store that offers a wide variety of food items, hygiene and cleaning products, personal care items, and other products for purchase.",
            "it_IT": "Un supermercato è un negozio che offre una vasta gamma di alimentari, prodotti per l'igiene e la pulizia, articoli per la cura personale e altri prodotti in vendita."
          },
          icon: "fa-shopping-cart"
        },
        wholesale: { 
          id: 2, 
          name: {
            "pt-BR": "Atacado",
            "en-US": "Wholesale",
            "it_IT": "Ingrosso"
          },
          description: { 
            "pt-BR": "O atacado é um tipo de estabelecimento que vende produtos em grandes quantidades para revendedores e empresas, geralmente a preços mais baixos que o varejo.",
            "en-US": "Wholesale is a type of establishment that sells products in large quantities to retailers and businesses, usually at lower prices than retail.",
            "it_IT": "L'ingrosso è un tipo di esercizio che vende prodotti in grandi quantità a rivenditori e aziende, di solito a prezzi più bassi rispetto al dettaglio."
          },
          icon: "fa-boxes"
        },
        convenience_store: { 
          id: 3, 
          name: {
            "pt-BR": "Loja de Conveniência",
            "en-US": "Convenience Store",
            "it_IT": "Negozio di Convenience"
          },
          description: { 
            "pt-BR": "Uma loja de conveniência é um estabelecimento que oferece uma variedade de produtos de consumo rápido, como lanches, bebidas, produtos de higiene e conveniência, geralmente aberto 24 horas por dia.",
            "en-US": "A convenience store is a store that offers a variety of quick consumption products, such as snacks, drinks, hygiene and convenience products, usually open 24 hours a day.",
            "it_IT": "Un negozio di convenience è un negozio che offre una varietà di prodotti a rapido consumo, come snack, bevande, prodotti per l'igiene e la convenienza, di solito aperto 24 ore su 24."
          },
          icon: "fa-store-alt"
        },
        department_store: { 
          id: 4, 
          name: {
            "pt-BR": "Loja de Departamentos",
            "en-US": "Department Store",
            "it_IT": "Grande Magazzino"
          },
          description: { 
            "pt-BR": "Uma loja de departamentos é um estabelecimento que oferece uma ampla variedade de produtos de diferentes categorias, como roupas, eletrônicos, móveis, eletrodomésticos e muito mais.",
            "en-US": "A department store is a store that offers a wide variety of products from different categories, such as clothing, electronics, furniture, appliances, and much more.",
            "it_IT": "Un grande magazzino è un negozio che offre una vasta gamma di prodotti di diverse categorie, come abbigliamento, elettronica, mobili, elettrodomestici e molto altro."
          },
          icon: "fa-building"
        },
        variety_store: { 
          id: 5, 
          name: {
            "pt-BR": "Loja de Variedades",
            "en-US": "Variety Store",
            "it_IT": "Negozio di Varietà"
          },
          description: { 
            "pt-BR": "Uma loja de variedades é um estabelecimento que oferece uma ampla gama de produtos diversos, incluindo itens de decoração, presentes, brinquedos, utensílios domésticos e muito mais.",
            "en-US": "A variety store is a store that offers a wide range of miscellaneous products, including decoration items, gifts, toys, household items, and much more.",
            "it_IT": "Un negozio di varietà è un negozio che offre una vasta gamma di prodotti vari, tra cui articoli per la decorazione, regali, giocattoli, articoli per la casa e molto altro."
          },
          icon: "fa-cubes"
        },
        electronics_store: { 
          id: 6, 
          name: {
            "pt-BR": "Loja de Eletrônicos",
            "en-US": "Electronics Store",
            "it_IT": "Negozio di Elettronica"
          },
          description: { 
            "pt-BR": "Uma loja de eletrônicos é um estabelecimento que oferece uma variedade de produtos eletrônicos, como dispositivos móveis, computadores, TVs, eletrodomésticos e acessórios eletrônicos.",
            "en-US": "An electronics store is a store that offers a variety of electronic products, such as mobile devices, computers, TVs, appliances, and electronic accessories.",
            "it_IT": "Un negozio di elettronica è un negozio che offre una varietà di prodotti elettronici, come dispositivi mobili, computer, TV, elettrodomestici e accessori elettronici."
          },
          icon: "fa-laptop"
        },
        furniture_store: { 
          id: 7, 
          name: {
            "pt-BR": "Loja de Móveis",
            "en-US": "Furniture Store",
            "it_IT": "Negozio di Mobili"
          },
          description: { 
            "pt-BR": "Uma loja de móveis é um estabelecimento que oferece uma variedade de móveis para casa e escritório, incluindo sofás, mesas, cadeiras, camas, armários e muito mais.",
            "en-US": "A furniture store is a store that offers a variety of furniture for home and office, including sofas, tables, chairs, beds, cabinets, and much more.",
            "it_IT": "Un negozio di mobili è un negozio che offre una varietà di mobili per casa e ufficio, tra cui divani, tavoli, sedie, letti, armadi e molto altro."
          },
          icon: "fa-chair"
        },
        building_materials_store: { 
          id: 8, 
          name: {
            "pt-BR": "Loja de Materiais de Construção",
            "en-US": "Building Materials Store",
            "it_IT": "Negozio di Materiali da Costruzione"
          },
          description: { 
            "pt-BR": "Uma loja de materiais de construção é um estabelecimento que oferece uma variedade de materiais e ferramentas necessárias para projetos de construção e reforma, incluindo materiais de construção, tintas, ferramentas, encanamentos e elétrica.",
            "en-US": "A building materials store is a store that offers a variety of materials and tools needed for construction and renovation projects, including building materials, paints, tools, plumbing, and electrical.",
            "it_IT": "Un negozio di materiali da costruzione è un negozio che offre una varietà di materiali e attrezzi necessari per progetti di costruzione e ristrutturazione, tra cui materiali da costruzione, vernici, utensili, impianti idraulici ed elettrici."
          },
          icon: "fa-tools"
        },
        toy_store: { 
          id: 9, 
          name: {
            "pt-BR": "Loja de Brinquedos",
            "en-US": "Toy Store",
            "it_IT": "Negozio di Giocattoli"
          },
          description: { 
            "pt-BR": "Uma loja de brinquedos é um estabelecimento que oferece uma variedade de brinquedos e jogos para crianças de todas as idades, incluindo bonecas, carrinhos, jogos educativos, quebra-cabeças e muito mais.",
            "en-US": "A toy store is a store that offers a variety of toys and games for children of all ages, including dolls, cars, educational games, puzzles, and much more.",
            "it_IT": "Un negozio di giocattoli è un negozio che offre una varietà di giocattoli e giochi per bambini di tutte le età, tra cui bambole, auto, giochi educativi, puzzle e molto altro."
          },
          icon: "fa-dice"
        },
        liquor_store: { 
          id: 10, 
          name: {
            "pt-BR": "Loja de Bebidas",
            "en-US": "Liquor Store",
            "it_IT": "Negozio di Bevande Alcoliche"
          },
          description: { 
            "pt-BR": "Uma loja de bebidas é um estabelecimento que oferece uma variedade de bebidas alcoólicas e não alcoólicas para compra, incluindo vinhos, cervejas, destilados, refrigerantes, sucos e muito mais.",
            "en-US": "A liquor store is a store that offers a variety of alcoholic and non-alcoholic beverages for purchase, including wines, beers, spirits, soft drinks, juices, and much more.",
            "it_IT": "Un negozio di bevande alcoliche è un negozio che offre una varietà di bevande alcoliche e analcoliche in vendita, tra cui vini, birre, distillati, bibite analcoliche, succhi e molto altro."
          },
          icon: "fa-wine-glass"
        },
        bakery: { 
          id: 11, 
          name: {
            "pt-BR": "Padaria",
            "en-US": "Bakery",
            "it_IT": "Panetteria"
          },
          description: { 
            "pt-BR": "Uma padaria é um estabelecimento que produz e vende uma variedade de produtos de panificação frescos, como pães, bolos, biscoitos, tortas e outros produtos assados.",
            "en-US": "A bakery is a establishment that produces and sells a variety of fresh baked goods, such as breads, cakes, cookies, pies, and other baked products.",
            "it_IT": "Una panetteria è un esercizio che produce e vende una varietà di prodotti da forno freschi, come pane, torte, biscotti, torte e altri prodotti da forno."
          },
          icon: "fa-bread-slice"
        },
        restaurant: { 
          id: 12, 
          name: {
            "pt-BR": "Restaurante",
            "en-US": "Restaurant",
            "it_IT": "Ristorante"
          },
          description: { 
            "pt-BR": "Um restaurante é um estabelecimento que oferece refeições preparadas para consumo no local, incluindo uma variedade de pratos e culinárias, desde pratos simples até pratos gourmet.",
            "en-US": "A restaurant is an establishment that offers prepared meals for consumption on-site, including a variety of dishes and cuisines, from simple dishes to gourmet dishes.",
            "it_IT": "Un ristorante è un esercizio che offre pasti preparati per il consumo sul posto, compresa una varietà di piatti e cucine, dai piatti semplici ai piatti gourmet."
          },
          icon: "fa-utensils"
        },
        bar: { 
          id: 13, 
          name: {
            "pt-BR": "Bar",
            "en-US": "Bar",
            "it_IT": "Bar"
          },
          description: { 
            "pt-BR": "Um bar é um estabelecimento que serve bebidas alcoólicas, refrigerantes, petiscos e outras opções de consumo, geralmente acompanhadas de música ao vivo ou entretenimento.",
            "en-US": "A bar is an establishment that serves alcoholic beverages, soft drinks, snacks, and other consumption options, usually accompanied by live music or entertainment.",
            "it_IT": "Un bar è un esercizio che serve bevande alcoliche, bibite analcoliche, snack e altre opzioni di consumo, solitamente accompagnate da musica dal vivo o intrattenimento."
          },
          icon: "fa-cocktail"
        },
        snack_bar: { 
          id: 14, 
          name: {
            "pt-BR": "Lanchonete",
            "en-US": "Snack Bar",
            "it_IT": "Bar di Snack"
          },
          description: { 
            "pt-BR": "Uma lanchonete é um estabelecimento que serve uma variedade de lanches rápidos e refeições leves, como sanduíches, salgados, sucos, refrigerantes e sobremesas.",
            "en-US": "A snack bar is an establishment that serves a variety of quick snacks and light meals, such as sandwiches, savory snacks, juices, soft drinks, and desserts.",
            "it_IT": "Un bar di snack è un esercizio che serve una varietà di snack veloci e pasti leggeri, come panini, snack salati, succhi, bibite analcoliche e dolci."
          },
          icon: "fa-hamburger"
        }
        // Add more store types with their respective properties and icons here...
      };
    }
  
    set language(l){
      this.lang=l
    }
  
    static item(id){
      let o = new StoreTypes()
      let found = o.data[id] || null
      console.warn('found')
      if (!found) return;
      return Object.assign(found, {name:found.name[o.lang]}, {description:found.description[o.lang]} )
    }
  
  }