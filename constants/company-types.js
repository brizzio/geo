class CompanyConstants{
    constructor(lang = 'pt-BR'){
      this.lang = lang
      this.legalTypes={
        limited: {
          id: 1,
          name: {
            "pt-BR": "Sociedade Limitada",
            "en-US": "Limited Liability Company",
            "it-IT": "Società a Responsabilità Limitata"
          },
          description: {
            "pt-BR": "Uma sociedade limitada é um tipo de empresa em que a responsabilidade dos sócios é limitada ao valor das suas quotas, não respondendo pessoalmente por dívidas ou obrigações da empresa.",
            "en-US": "A limited liability company is a type of company in which the liability of the partners is limited to the amount of their shares, not personally liable for the debts or obligations of the company.",
            "it-IT": "Una società a responsabilità limitata è un tipo di società in cui la responsabilità dei soci è limitata all'importo delle loro quote, non rispondendo personalmente per i debiti o gli obblighi della società."
          },
          icon: "fa-building"
        },
        public: {
          id: 2,
          name: {
            "pt-BR": "Sociedade Anônima",
            "en-US": "Public Limited Company",
            "it-IT": "Società per Azioni"
          },
          description: {
            "pt-BR": "Uma sociedade anônima é uma empresa cujo capital é dividido em ações, e cujos acionistas têm responsabilidade limitada, respondendo apenas pelo valor das ações subscritas ou adquiridas.",
            "en-US": "A public limited company is a company whose capital is divided into shares, and whose shareholders have limited liability, being liable only for the value of the shares subscribed or acquired.",
            "it-IT": "Una società per azioni è un'impresa il cui capitale è diviso in azioni, e i cui azionisti hanno responsabilità limitata, essendo responsabili solo per il valore delle azioni sottoscritte o acquistate."
          },
          icon: "fa-chart-line"
        },
        partnership: {
          id: 3,
          name: {
            "pt-BR": "Sociedade em Nome Coletivo",
            "en-US": "General Partnership",
            "it-IT": "Società in Nome Collettivo"
          },
          description: {
            "pt-BR": "Uma sociedade em nome coletivo é um tipo de sociedade em que todos os sócios respondem solidária e ilimitadamente pelas dívidas da empresa, com seus próprios bens pessoais.",
            "en-US": "A general partnership is a type of partnership in which all partners are jointly and severally liable for the debts of the company, with their own personal assets.",
            "it-IT": "Una società in nome collettivo è un tipo di società in cui tutti i soci sono responsabili in solido per i debiti della società, con i propri beni personali."
          },
          icon: "fa-handshake"
        },
        sole_proprietorship: {
          id: 4,
          name: {
            "pt-BR": "Empresário Individual",
            "en-US": "Sole Proprietorship",
            "it-IT": "Impresa Individuale"
          },
          description: {
            "pt-BR": "Um empresário individual é uma empresa constituída por uma única pessoa, que responde ilimitadamente pelas dívidas da empresa com seu próprio patrimônio pessoal.",
            "en-US": "A sole proprietorship is a business formed by a single individual, who is personally liable for the debts of the company with their own personal assets.",
            "it-IT": "Un'impresa individuale è un'azienda costituita da un singolo individuo, che è personalmente responsabile dei debiti dell'azienda con il proprio patrimonio personale."
          },
          icon: "fa-user"
        },
        cooperative: {
          id: 5,
          name: {
            "pt-BR": "Cooperativa",
            "en-US": "Cooperative",
            "it-IT": "Cooperativa"
          },
          description: {
            "pt-BR": "Uma cooperativa é uma associação autônoma de pessoas que se unem voluntariamente para atender a suas necessidades econômicas, sociais e culturais em comum, por meio de uma empresa de propriedade conjunta e democrática.",
            "en-US": "A cooperative is an autonomous association of persons who voluntarily join together to meet their common economic, social, and cultural needs through a jointly owned and democratically controlled enterprise.",
            "it-IT": "Una cooperativa è un'associazione autonoma di persone che si uniscono volontariamente per soddisfare i propri bisogni economici, sociali e culturali comuni attraverso un'impresa di proprietà congiunta e democraticamente controllata."
          },
          icon: "fa-hands-helping"
        },
        limited_partnership: {
          id: 6,
          name: {
            "pt-BR": "Sociedade em Comandita Simples",
            "en-US": "Limited Partnership",
            "it-IT": "Società in Accomandita Semplice"
          },
          description: {
            "pt-BR": "Uma sociedade em comandita simples é um tipo de sociedade em que há dois tipos de sócios: os comanditados, que têm responsabilidade ilimitada, e os comanditários, que têm responsabilidade limitada ao valor de suas cotas.",
            "en-US": "A limited partnership is a type of partnership in which there are two types of partners: general partners, who have unlimited liability, and limited partners, who have liability limited to the value of their shares.",
            "it-IT": "Una società in accomandita semplice è un tipo di società in cui ci sono due tipi di soci: i soci accomandatari, che hanno responsabilità illimitata, e i soci accomandanti, che hanno responsabilità limitata al valore delle loro quote."
          },
          icon: "fa-balance-scale"
        },
        joint_stock: {
          id: 7,
          name: {
            "pt-BR": "Sociedade em Comandita por Ações",
            "en-US": "Joint Stock Company",
            "it-IT": "Società per Azioni a Comandita"
          },
          description: {
            "pt-BR": "Uma sociedade em comandita por ações é uma sociedade que combina características de uma sociedade em comandita simples e de uma sociedade anônima, tendo sócios comanditados e comanditários, bem como acionistas.",
            "en-US": "A joint stock company is a company that combines characteristics of a limited partnership and a public limited company, having general partners and limited partners, as well as shareholders.",
            "it-IT": "Una società in accomandita per azioni è una società che combina caratteristiche di una società in accomandita semplice e di una società per azioni, avendo soci accomandatari e accomandanti, nonché azionisti."
          },
          icon: "fa-balance-scale-right"
        },
        nonprofit: {
          id: 8,
          name: {
            "pt-BR": "Organização Sem Fins Lucrativos",
            "en-US": "Nonprofit Organization",
            "it-IT": "Organizzazione Non Lucrativa"
          },
          description: {
            "pt-BR": "Uma organização sem fins lucrativos é uma entidade que tem como objetivo promover causas sociais, culturais, religiosas, educacionais, científicas, artísticas, recreativas ou de assistência, sem visar lucro para seus membros ou dirigentes.",
            "en-US": "A nonprofit organization is an entity that aims to promote social, cultural, religious, educational, scientific, artistic, recreational, or charitable causes, without seeking profit for its members or leaders.",
            "it-IT": "Un'organizzazione non lucrativa è un ente che si propone di promuovere cause sociali, culturali, religiose, educative, scientifiche, artistiche, ricreative o di beneficenza, senza cercare il profitto per i suoi membri o dirigenti."
          },
          icon: "fa-heart"
        }
        // Add more company types with their respective properties and icons here...
      };
      this.departmentTypes={
        finance: {
          id: 1,
          name: {
            "pt-BR": "Financeiro",
            "en-US": "Finance",
            "it-IT": "Finanza"
          },
          description: {
            "pt-BR": "O departamento financeiro é responsável por gerenciar as finanças da empresa, incluindo contabilidade, orçamento e análise financeira.",
            "en-US": "The finance department is responsible for managing the company's finances, including accounting, budgeting, and financial analysis.",
            "it-IT": "Il dipartimento finanziario è responsabile della gestione delle finanze dell'azienda, comprese la contabilità, la pianificazione del budget e l'analisi finanziaria."
          },
          icon: "fa-money-bill-wave"
        },
        human_resources: {
          id: 2,
          name: {
            "pt-BR": "Recursos Humanos",
            "en-US": "Human Resources",
            "it-IT": "Risorse Umane"
          },
          description: {
            "pt-BR": "O departamento de recursos humanos é responsável pela gestão dos funcionários da empresa, incluindo recrutamento, treinamento, benefícios e relações trabalhistas.",
            "en-US": "The human resources department is responsible for managing the company's employees, including recruitment, training, benefits, and labor relations.",
            "it-IT": "Il dipartimento delle risorse umane è responsabile della gestione dei dipendenti dell'azienda, inclusi reclutamento, formazione, benefit e relazioni sindacali."
          },
          icon: "fa-users"
        },
        marketing: {
          id: 3,
          name: {
            "pt-BR": "Marketing",
            "en-US": "Marketing",
            "it-IT": "Marketing"
          },
          description: {
            "pt-BR": "O departamento de marketing é responsável pela criação, promoção e divulgação da marca e produtos da empresa.",
            "en-US": "The marketing department is responsible for creating, promoting, and advertising the company's brand and products.",
            "it-IT": "Il dipartimento marketing è responsabile della creazione, promozione e pubblicità del marchio e dei prodotti dell'azienda."
          },
          icon: "fa-bullhorn"
        },
        sales: {
          id: 4,
          name: {
            "pt-BR": "Vendas",
            "en-US": "Sales",
            "it-IT": "Vendite"
          },
          description: {
            "pt-BR": "O departamento de vendas é responsável por prospectar, negociar e fechar vendas de produtos ou serviços da empresa.",
            "en-US": "The sales department is responsible for prospecting, negotiating, and closing sales of the company's products or services.",
            "it-IT": "Il dipartimento vendite è responsabile della ricerca, trattativa e chiusura delle vendite dei prodotti o servizi dell'azienda."
          },
          icon: "fa-chart-line"
        },
        operations: {
          id: 5,
          name: {
            "pt-BR": "Operações",
            "en-US": "Operations",
            "it-IT": "Operazioni"
          },
          description: {
            "pt-BR": "O departamento de operações é responsável por garantir a eficiência e o funcionamento adequado das operações da empresa.",
            "en-US": "The operations department is responsible for ensuring the efficiency and proper functioning of the company's operations.",
            "it-IT": "Il dipartimento operazioni è responsabile di garantire l'efficienza e il corretto funzionamento delle operazioni aziendali."
          },
          icon: "fa-cogs"
        },
        customer_service: {
          id: 6,
          name: {
            "pt-BR": "Atendimento ao Cliente",
            "en-US": "Customer Service",
            "it-IT": "Servizio Clienti"
          },
          description: {
            "pt-BR": "O departamento de atendimento ao cliente é responsável por fornecer suporte e assistência aos clientes da empresa.",
            "en-US": "The customer service department is responsible for providing support and assistance to the company's customers.",
            "it-IT": "Il dipartimento servizio clienti è responsabile di fornire supporto e assistenza ai clienti dell'azienda."
          },
          icon: "fa-headset"
        },
        research_and_development: {
          id: 7,
          name: {
            "pt-BR": "Pesquisa e Desenvolvimento",
            "en-US": "Research and Development",
            "it-IT": "Ricerca e Sviluppo"
          },
          description: {
            "pt-BR": "O departamento de pesquisa e desenvolvimento é responsável por conduzir pesquisas e desenvolver novos produtos ou tecnologias para a empresa.",
            "en-US": "The research and development department is responsible for conducting research and developing new products or technologies for the company.",
            "it-IT": "Il dipartimento ricerca e sviluppo è responsabile di condurre ricerche e sviluppare nuovi prodotti o tecnologie per l'azienda."
          },
          icon: "fa-flask"
        },
        legal: {
          id: 8,
          name: {
            "pt-BR": "Jurídico",
            "en-US": "Legal",
            "it-IT": "Legale"
          },
          description: {
            "pt-BR": "O departamento jurídico é responsável por fornecer orientação jurídica e garantir conformidade legal para a empresa.",
            "en-US": "The legal department is responsible for providing legal guidance and ensuring legal compliance for the company.",
            "it-IT": "Il dipartimento legale è responsabile di fornire consulenza legale e garantire la conformità legale per l'azienda."
          },
          icon: "fa-balance-scale"
        }
        // Add more departments with their respective properties and icons here...
      };
      this.userProfiles={
        comercial: {
          id: 1,
          name: {
            "pt-BR": "Comercial",
            "en-US": "Commercial",
            "it-IT": "Commerciale"
          },
          description: {
            "pt-BR": "O perfil comercial tem responsabilidades relacionadas às vendas, negociações e relacionamento com clientes.",
            "en-US": "The commercial profile has responsibilities related to sales, negotiations, and customer relationships.",
            "it-IT": "Il profilo commerciale ha responsabilità legate alle vendite, alle trattative e ai rapporti con i clienti."
          },
          icon: "fa-handshake"
        },
        consultor: {
          id: 2,
          name: {
            "pt-BR": "Consultor",
            "en-US": "Consultant",
            "it-IT": "Consulente"
          },
          description: {
            "pt-BR": "O perfil de consultor tem responsabilidades relacionadas à consultoria, análise e recomendações para os clientes.",
            "en-US": "The consultant profile has responsibilities related to consultancy, analysis, and recommendations for clients.",
            "it-IT": "Il profilo del consulente ha responsabilità legate alla consulenza, all'analisi e alle raccomandazioni per i clienti."
          },
          icon: "fa-user-tie"
        },
        administrador: {
          id: 3,
          name: {
            "pt-BR": "Administrador",
            "en-US": "Administrator",
            "it-IT": "Amministratore"
          },
          description: {
            "pt-BR": "O perfil de administrador tem responsabilidades relacionadas à gestão e administração do sistema.",
            "en-US": "The administrator profile has responsibilities related to system management and administration.",
            "it-IT": "Il profilo amministratore ha responsabilità legate alla gestione e all'amministrazione del sistema."
          },
          icon: "fa-user-cog"
        },
        ti: {
          id: 4,
          name: {
            "pt-BR": "TI",
            "en-US": "IT",
            "it-IT": "IT"
          },
          description: {
            "pt-BR": "O perfil de TI tem responsabilidades relacionadas à infraestrutura, suporte técnico e desenvolvimento de sistemas.",
            "en-US": "The IT profile has responsibilities related to infrastructure, technical support, and system development.",
            "it-IT": "Il profilo IT ha responsabilità legate all'infrastruttura, al supporto tecnico e allo sviluppo di sistemi."
          },
          icon: "fa-laptop-code"
        },
        suporte: {
          id: 5,
          name: {
            "pt-BR": "Suporte",
            "en-US": "Support",
            "it-IT": "Supporto"
          },
          description: {
            "pt-BR": "O perfil de suporte tem responsabilidades relacionadas ao atendimento e suporte aos usuários do sistema.",
            "en-US": "The support profile has responsibilities related to attending and supporting system users.",
            "it-IT": "Il profilo supporto ha responsabilità legate all'assistenza e al supporto degli utenti del sistema."
          },
          icon: "fa-headset"
        },
        gestor_socio: {
          id: 6,
          name: {
            "pt-BR": "Gestor Sócio",
            "en-US": "Partner Manager",
            "it-IT": "Gestore Partner"
          },
          description: {
            "pt-BR": "O perfil de gestor sócio tem responsabilidades relacionadas à gestão de parcerias e relacionamento com sócios.",
            "en-US": "The partner manager profile has responsibilities related to partnership management and relationship with partners.",
            "it-IT": "Il profilo del gestore partner ha responsabilità legate alla gestione delle partnership e al rapporto con i partner."
          },
          icon: "fa-users"
        },
        marketing: {
          id: 7,
          name: {
            "pt-BR": "Marketing",
            "en-US": "Marketing",
            "it-IT": "Marketing"
          },
          description: {
            "pt-BR": "O perfil de marketing tem responsabilidades relacionadas à criação, promoção e divulgação da marca e produtos.",
            "en-US": "The marketing profile has responsibilities related to brand and product creation, promotion, and marketing.",
            "it-IT": "Il profilo marketing ha responsabilità legate alla creazione, promozione e marketing del marchio e dei prodotti."
          },
          icon: "fa-bullhorn"
        },
        vendas: {
          id: 8,
          name: {
            "pt-BR": "Vendas",
            "en-US": "Sales",
            "it-IT": "Vendite"
          },
          description: {
            "pt-BR": "O perfil de vendas tem responsabilidades relacionadas à prospecção, negociação e fechamento de vendas.",
            "en-US": "The sales profile has responsibilities related to prospecting, negotiating, and closing sales.",
            "it-IT": "Il profilo vendite ha responsabilità legate alla ricerca di nuovi clienti, trattativa e chiusura delle vendite."
          },
          icon: "fa-dollar-sign"
        },
        pricing: {
          id: 9,
          name: {
            "pt-BR": "Pricing",
            "en-US": "Pricing",
            "it-IT": "Pricing"
          },
          description: {
            "pt-BR": "O perfil de pricing tem responsabilidades relacionadas à definição de preços e estratégias de precificação.",
            "en-US": "The pricing profile has responsibilities related to pricing definition and pricing strategies.",
            "it-IT": "Il profilo pricing ha responsabilità legate alla definizione dei prezzi e alle strategie di pricing."
          },
          icon: "fa-tags"
        },
        financeiro: {
          id: 10,
          name: {
            "pt-BR": "Financeiro",
            "en-US": "Financial",
            "it-IT": "Finanziario"
          },
          description: {
            "pt-BR": "O perfil financeiro tem responsabilidades relacionadas à gestão financeira, contabilidade e análise financeira.",
            "en-US": "The financial profile has responsibilities related to financial management, accounting, and financial analysis.",
            "it-IT": "Il profilo finanziario ha responsabilità legate alla gestione finanziaria, contabilità e analisi finanziaria."
          },
          icon: "fa-chart-line"
        },
        compras: {
          id: 11,
          name: {
            "pt-BR": "Compras",
            "en-US": "Purchases",
            "it-IT": "Acquisti"
          },
          description: {
            "pt-BR": "O perfil de compras tem responsabilidades relacionadas à aquisição de produtos e serviços para a empresa.",
            "en-US": "The purchasing profile has responsibilities related to acquiring products and services for the company.",
            "it-IT": "Il profilo degli acquisti ha responsabilità legate all'acquisto di prodotti e servizi per l'azienda."
          },
          icon: "fa-shopping-cart"
        }

      };
    }
  
    set language(l){
      this.lang=l
    }
  
    static legal(id){
      let o = new CompanyConstants()
      let found = o.legalTypes[id] || null
      console.warn('found')
      if (!found) return;
      return Object.assign(found, {name:found.name[o.lang]}, {description:found.description[o.lang]} )
    }

    static department(id){
      let o = new CompanyConstants()
      let found = o.departmentTypes[id] || null
      console.warn('found')
      if (!found) return;
      return Object.assign(found, {name:found.name[o.lang]}, {description:found.description[o.lang]} )
    }

    static profile(id){
      let o = new CompanyConstants()
      let found = o.userProfiles[id] || null
      console.warn('found')
      if (!found) return;
      return Object.assign(found, {name:found.name[o.lang]}, {description:found.description[o.lang]} )
    }
  
  }