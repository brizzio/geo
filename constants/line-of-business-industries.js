class Industries{
    constructor(lang = 'pt-BR'){
      this.lang = lang
      this.data=[
        {
          id: "agriculture",
          name: {
            "pt-BR": "Agricultura",
            "en-US": "Agriculture",
            "it_IT": "Agricoltura"
          },
          description: {
            "pt-BR": "A indústria agrícola abrange atividades relacionadas ao cultivo de plantas e criação de animais para alimentação, fibras, medicamentos e outros produtos.",
            "en-US": "The agricultural industry encompasses activities related to the cultivation of plants and the raising of animals for food, fibers, medicines, and other products.",
            "it_IT": "Il settore agricolo comprende le attività legate alla coltivazione di piante e all'allevamento di animali per cibo, fibre, medicinali e altri prodotti."
          },
          icon: "fa-seedling"
        },
        {
          id: "automotive",
          name: {
            "pt-BR": "Automotivo",
            "en-US": "Automotive",
            "it_IT": "Automobilistico"
          },
          description: {
            "pt-BR": "A indústria automotiva engloba a fabricação de veículos motorizados, incluindo carros, caminhões, ônibus, motocicletas, entre outros.",
            "en-US": "The automotive industry encompasses the manufacturing of motor vehicles, including cars, trucks, buses, motorcycles, and more.",
            "it_IT": "Il settore automobilistico comprende la produzione di veicoli a motore, tra cui auto, camion, autobus, motociclette e altro."
          },
          icon: "fa-car"
        },
        {
          id: "banking",
          name: {
            "pt-BR": "Bancário",
            "en-US": "Banking",
            "it_IT": "Bancario"
          },
          description: {
            "pt-BR": "O setor bancário engloba instituições financeiras que oferecem serviços como depósitos, empréstimos, investimentos e gestão financeira.",
            "en-US": "The banking sector encompasses financial institutions that offer services such as deposits, loans, investments, and financial management.",
            "it_IT": "Il settore bancario comprende istituzioni finanziarie che offrono servizi come depositi, prestiti, investimenti e gestione finanziaria."
          },
          icon: "fa-university"
        },
        {
          id: "construction",
          name: {
            "pt-BR": "Construção Civil",
            "en-US": "Construction",
            "it_IT": "Costruzioni"
          },
          description: {
            "pt-BR": "O setor de construção civil abrange atividades relacionadas à construção, reforma e manutenção de edifícios, estradas, pontes e outras infraestruturas.",
            "en-US": "The construction industry encompasses activities related to building, renovating, and maintaining buildings, roads, bridges, and other infrastructure.",
            "it_IT": "Il settore delle costruzioni comprende attività legate alla costruzione, ristrutturazione e manutenzione di edifici, strade, ponti e altre infrastrutture."
          },
          icon: "fa-hard-hat"
        },
        {
          id: "education",
          name: {
            "pt-BR": "Educação",
            "en-US": "Education",
            "it_IT": "Educazione"
          },
          description: {
            "pt-BR": "O setor educacional engloba instituições e práticas relacionadas ao ensino e aprendizado, incluindo escolas, universidades, treinamentos e desenvolvimento profissional.",
            "en-US": "The education sector encompasses institutions and practices related to teaching and learning, including schools, universities, training, and professional development.",
            "it_IT": "Il settore dell'educazione comprende istituzioni e pratiche legate all'insegnamento e all'apprendimento, tra cui scuole, università, formazione e sviluppo professionale."
          },
          icon: "fa-graduation-cap"
        },
        {
          id: "energy",
          name: {
            "pt-BR": "Energia",
            "en-US": "Energy",
            "it_IT": "Energia"
          },
          description: {
            "pt-BR": "O setor energético engloba a produção, distribuição e uso de energia, incluindo fontes como petróleo, gás natural, carvão, energia nuclear, eólica e solar.",
            "en-US": "The energy sector encompasses the production, distribution, and use of energy, including sources such as oil, natural gas, coal, nuclear, wind, and solar power.",
            "it_IT": "Il settore energetico comprende la produzione, distribuzione e utilizzo dell'energia, incluse fonti come petrolio, gas naturale, carbone, nucleare, eolica e solare."
          },
          icon: "fa-bolt"
        },
        {
          id: "healthcare",
          name: {
            "pt-BR": "Saúde",
            "en-US": "Healthcare",
            "it_IT": "Assistenza sanitaria"
          },
          description: {
            "pt-BR": "O setor de saúde abrange serviços e atividades relacionadas ao cuidado e promoção da saúde, incluindo hospitais, clínicas, consultórios médicos, e pesquisa médica.",
            "en-US": "The healthcare sector encompasses services and activities related to the care and promotion of health, including hospitals, clinics, medical practices, and medical research.",
            "it_IT": "Il settore sanitario comprende servizi e attività legati alla cura e alla promozione della salute, tra cui ospedali, cliniche, studi medici e ricerca medica."
          },
          icon: "fa-hospital"
        },
        {
          id: "technology",
          name: {
            "pt-BR": "Tecnologia",
            "en-US": "Technology",
            "it_IT": "Tecnologia"
          },
          description: {
            "pt-BR": "O setor de tecnologia engloba empresas e produtos relacionados ao desenvolvimento e aplicação de conhecimentos técnicos e científicos em diversas áreas, como informática, telecomunicações, biotecnologia e eletrônica.",
            "en-US": "The technology sector encompasses companies and products related to the development and application of technical and scientific knowledge in various fields, such as computing, telecommunications, biotechnology, and electronics.",
            "it_IT": "Il settore tecnologico comprende aziende e prodotti legati allo sviluppo e all'applicazione di conoscenze tecniche e scientifiche in vari campi, come informatica, telecomunicazioni, biotecnologie ed elettronica."
          },
          icon: "fa-laptop-code"
        },
        {
          id: "tourism",
          name: {
            "pt-BR": "Turismo",
            "en-US": "Tourism",
            "it_IT": "Turismo"
          },
          description: {
            "pt-BR": "O setor de turismo engloba atividades relacionadas a viagens, hospedagem, lazer e entretenimento, incluindo hotéis, agências de viagem, parques temáticos e atrações turísticas.",
            "en-US": "The tourism sector encompasses activities related to travel, accommodation, leisure, and entertainment, including hotels, travel agencies, theme parks, and tourist attractions.",
            "it_IT": "Il settore turistico comprende attività legate ai viaggi, all'alloggio, al tempo libero e all'intrattenimento, tra cui hotel, agenzie di viaggio, parchi tematici e attrazioni turistiche."
          },
          icon: "fa-globe"
        },
        {
          id: "transportation",
          name: {
            "pt-BR": "Transporte",
            "en-US": "Transportation",
            "it_IT": "Trasporti"
          },
          description: {
            "pt-BR": "O setor de transporte engloba serviços e infraestruturas relacionadas ao movimento de pessoas e mercadorias, incluindo rodovias, ferrovias, transporte público, e logística.",
            "en-US": "The transportation sector encompasses services and infrastructures related to the movement of people and goods, including highways, railways, public transportation, and logistics.",
            "it_IT": "Il settore dei trasporti comprende servizi e infrastrutture legati al movimento di persone e merci, tra cui autostrade, ferrovie, trasporto pubblico e logistica."
          },
          icon: "fa-truck"
        },
        {
          id: "retail",
          name: {
            "pt-BR": "Varejo",
            "en-US": "Retail",
            "it_IT": "Vendita al dettaglio"
          },
          description: {
            "pt-BR": "O setor varejista engloba a venda de produtos diretamente aos consumidores finais, por meio de lojas físicas, online, catálogos e outros canais de venda.",
            "en-US": "The retail sector encompasses the sale of products directly to end consumers, through physical stores, online, catalogs, and other sales channels.",
            "it_IT": "Il settore della vendita al dettaglio comprende la vendita di prodotti direttamente ai consumatori finali, attraverso negozi fisici, online, cataloghi e altri canali di vendita."
          },
          icon: "fa-shopping-cart"
        },
        {
          id: "food_and_beverage",
          name: {
            "pt-BR": "Alimentos e Bebidas",
            "en-US": "Food & Beverage",
            "it_IT": "Alimentari e bevande"
          },
          description: {
            "pt-BR": "O setor de alimentos e bebidas engloba a produção, processamento e distribuição de alimentos e bebidas para consumo humano, incluindo alimentos processados, bebidas alcoólicas, não alcoólicas e muito mais.",
            "en-US": "The food and beverage sector encompasses the production, processing, and distribution of food and beverages for human consumption, including processed foods, alcoholic beverages, non-alcoholic beverages, and more.",
            "it_IT": "Il settore alimentare e delle bevande comprende la produzione, la lavorazione e la distribuzione di alimenti e bevande per il consumo umano, tra cui alimenti trasformati, bevande alcoliche, bevande analcoliche e molto altro."
          },
          icon: "fa-utensils"
        },
        {
          id: "entertainment",
          name: {
            "pt-BR": "Entretenimento",
            "en-US": "Entertainment",
            "it_IT": "Intrattenimento"
          },
          description: {
            "pt-BR": "O setor de entretenimento engloba atividades relacionadas ao lazer, diversão e entretenimento, incluindo filmes, música, jogos, parques temáticos, eventos ao vivo e muito mais.",
            "en-US": "The entertainment sector encompasses activities related to leisure, fun, and entertainment, including movies, music, games, theme parks, live events, and more.",
            "it_IT": "Il settore dell'intrattenimento comprende attività legate al tempo libero, al divertimento e all'intrattenimento, tra cui film, musica, giochi, parchi tematici, eventi dal vivo e molto altro."
          },
          icon: "fa-film"
        },
        {
          id: "real_estate",
          name: {
            "pt-BR": "Imobiliária",
            "en-US": "Real Estate",
            "it_IT": "Immobiliare"
          },
          description: {
            "pt-BR": "O setor imobiliário engloba a compra, venda, locação e desenvolvimento de propriedades, incluindo terrenos, residências, edifícios comerciais e empreendimentos imobiliários.",
            "en-US": "The real estate sector encompasses the buying, selling, renting, and development of properties, including land, residential homes, commercial buildings, and real estate developments.",
            "it_IT": "Il settore immobiliare comprende l'acquisto, la vendita, l'affitto e lo sviluppo di proprietà, tra cui terreni, case residenziali, edifici commerciali e sviluppi immobiliari."
          },
          icon: "fa-building"
        },
        {
          id: "manufacturing",
          name: {
            "pt-BR": "Manufatura",
            "en-US": "Manufacturing",
            "it_IT": "Manifattura"
          },
          description: {
            "pt-BR": "O setor manufatureiro engloba a produção de bens físicos por meio de processos industriais, incluindo fabricação, montagem, embalagem e distribuição de produtos.",
            "en-US": "The manufacturing sector encompasses the production of physical goods through industrial processes, including manufacturing, assembly, packaging, and distribution of products.",
            "it_IT": "Il settore manifatturiero comprende la produzione di beni fisici tramite processi industriali, tra cui produzione, assemblaggio, confezionamento e distribuzione di prodotti."
          },
          icon: "fa-industry"
        },
        {
          id: "finance",
          name: {
            "pt-BR": "Finanças",
            "en-US": "Finance",
            "it_IT": "Finanza"
          },
          description: {
            "pt-BR": "O setor financeiro engloba atividades relacionadas à gestão, investimento e circulação de recursos financeiros, incluindo bancos, seguradoras, corretoras e fundos de investimento.",
            "en-US": "The finance sector encompasses activities related to the management, investment, and circulation of financial resources, including banks, insurance companies, brokerages, and investment funds.",
            "it_IT": "Il settore finanziario comprende attività legate alla gestione, all'investimento e alla circolazione di risorse finanziarie, tra cui banche, compagnie di assicurazione, agenzie di intermediazione e fondi di investimento."
          },
          icon: "fa-money-bill-wave"
        },
        {
          id: "telecommunications",
          name: {
            "pt-BR": "Telecomunicações",
            "en-US": "Telecommunications",
            "it_IT": "Telecomunicazioni"
          },
          description: {
            "pt-BR": "O setor de telecomunicações engloba serviços e infraestruturas relacionadas à transmissão e recepção de informações, incluindo telefonia fixa, móvel, internet, televisão e comunicações de dados.",
            "en-US": "The telecommunications sector encompasses services and infrastructures related to the transmission and reception of information, including fixed-line telephony, mobile, internet, television, and data communications.",
            "it_IT": "Il settore delle telecomunicazioni comprende servizi e infrastrutture legati alla trasmissione e ricezione di informazioni, tra cui telefonia fissa, mobile, internet, televisione e comunicazioni di dati."
          },
          icon: "fa-satellite-dish"
        },
        {
          id: "insurance",
          name: {
            "pt-BR": "Seguros",
            "en-US": "Insurance",
            "it_IT": "Assicurazioni"
          },
          description: {
            "pt-BR": "O setor de seguros engloba a oferta de proteção financeira contra riscos e perdas, incluindo seguros de vida, saúde, automóveis, residenciais e outros tipos de seguro.",
            "en-US": "The insurance sector encompasses the provision of financial protection against risks and losses, including life, health, auto, home, and other types of insurance.",
            "it_IT": "Il settore assicurativo comprende la fornitura di protezione finanziaria contro rischi e perdite, inclusi vita, salute, auto, casa e altri tipi di assicurazione."
          },
          icon: "fa-shield-alt"
        }
        // Add more industries with their respective properties and icons here...
      ];
    }
    
    get options(){
      
      return this.data.map(item=>(
        {
          id:item.id, 
          label:item.name[this.lang],
          description:item.description[this.lang],
        }
      ))
    }

    set language(l){
      this.lang=l
    }
  
    static item(id){
      let ind = new Industries()
      let found = ind.data.find(item=>item['id'] == id)
      if (!found) return;
      return Object.assign(found, {name:found.name[ind.lang]}, {description:found.description[ind.lang]} )
    }
  
  }