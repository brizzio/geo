const SNAPSHOT_VERSION = 1;

function base(dataset) {
  return {
    schema_version: SNAPSHOT_VERSION,
    dataset,
    exported_at: new Date().toISOString()
  };
}

export function tenantsTemplate() {
  return {
    ...base("tenants"),
    items: [
      {
        id: "tenant_demo_1",
        name: "Tenant Demo",
        person_type: "PJ",
        document: "12.345.678/0001-99",
        logo_base64: null,
        address: {
          street: "Avenida Paulista",
          street_number: "1000",
          neighbourhood: "Bela Vista",
          city: "Sao Paulo",
          state: "SP",
          postcode: "01310-100",
          country: "Brasil",
          display_name: "Avenida Paulista 1000, Bela Vista, Sao Paulo, SP, Brasil"
        },
        geo: {
          latlon: [-23.564224, -46.653156],
          source: "nominatim"
        }
      }
    ]
  };
}

export function networksTemplate(tenantId = "tenant_demo_1") {
  return {
    ...base("networks"),
    tenant_id: tenantId,
    items: [
      {
        id: "network_demo_1",
        tenant_id: tenantId,
        name: "Rede Demo",
        sector: "RETAIL",
        segment: "FMCG_CPG",
        description: "Rede principal de exemplo",
        headquarter: {
          address: {
            street: "Alameda Santos",
            street_number: "734",
            neighbourhood: "Jardim Paulista",
            city: "Sao Paulo",
            state: "SP",
            postcode: "01418-100",
            country: "Brasil",
            display_name: "Alameda Santos 734, Jardim Paulista, Sao Paulo, SP, Brasil"
          },
          geo: {
            latlon: [-23.565531, -46.654379],
            source: "nominatim"
          }
        }
      }
    ]
  };
}

export function retailBannersTemplate(tenantId = "tenant_demo_1", networkId = "network_demo_1") {
  return {
    ...base("retail_banners"),
    tenant_id: tenantId,
    items: [
      {
        id: "banner_demo_1",
        tenant_id: tenantId,
        network_id: networkId,
        code: "BAN_A",
        name: "Bandeira A",
        network_type: "DOS",
        network_channel: "PHYSICAL",
        description: "Bandeira de exemplo",
        logo: {
          provider: "imgbb",
          id: "demo_logo_id_1",
          image_url: "https://example.com/logo-bandeira-a.png",
          display_url: "https://example.com/logo-bandeira-a-display.png",
          thumb_url: "https://example.com/logo-bandeira-a-thumb.png",
          medium_url: "https://example.com/logo-bandeira-a-medium.png",
          delete_url: "https://example.com/logo-bandeira-a-delete"
        },
        logo_url: "https://example.com/logo-bandeira-a.png"
      }
    ]
  };
}

export function ownStoresTemplate(
  tenantId = "tenant_demo_1",
  networkId = "network_demo_1",
  bannerId = "banner_demo_1"
) {
  return {
    ...base("own_stores"),
    tenant_id: tenantId,
    items: [
      {
        id: "store_own_demo_1",
        tenant_id: tenantId,
        network_id: networkId,
        banner_id: bannerId,
        kind: "OWN",
        internal_code: "LJ001",
        short_name: "Loja 01",
        store_number: "0001",
        code: "LJ001",
        name: "Loja Propria 01",
        address: {
          street: "Rua Exemplo",
          street_number: "123",
          neighbourhood: "Centro",
          city: "Sao Paulo",
          state: "SP",
          postcode: "01000-000",
          country: "Brasil",
          display_name: "Rua Exemplo 123, Centro, Sao Paulo, SP, Brasil"
        },
        geo: {
          latlon: [-23.55052, -46.633308],
          source: "nominatim"
        },
        address_city: "Sao Paulo",
        address_state: "SP",
        facade: {
          provider: "imgbb",
          id: "demo_facade_1",
          image_url: "https://example.com/facade-store-1.jpg",
          display_url: "https://example.com/facade-store-1-display.jpg",
          thumb_url: "https://example.com/facade-store-1-thumb.jpg",
          medium_url: "https://example.com/facade-store-1-medium.jpg",
          delete_url: "https://example.com/facade-store-1-delete"
        },
        facade_url: "https://example.com/facade-store-1.jpg"
      }
    ]
  };
}

export function competitorStoresTemplate(
  tenantId = "tenant_demo_1",
  networkId = "network_demo_1"
) {
  return {
    ...base("competitor_stores"),
    tenant_id: tenantId,
    items: [
      {
        id: "store_comp_demo_1",
        tenant_id: tenantId,
        network_id: networkId,
        kind: "COMPETITOR",
        competitor_banner_name: "Carrefour",
        competitor_banner_logo: {
          provider: "imgbb",
          id: "demo_comp_banner_logo_1",
          image_url: "https://example.com/logo-carrefour.png",
          display_url: "https://example.com/logo-carrefour-display.png",
          thumb_url: "https://example.com/logo-carrefour-thumb.png",
          medium_url: "https://example.com/logo-carrefour-medium.png",
          delete_url: "https://example.com/logo-carrefour-delete"
        },
        competitor_banner_logo_url: "https://example.com/logo-carrefour.png",
        internal_code: "CMP001",
        short_name: "Comp 01",
        code: "CMP001",
        name: "Concorrente 01",
        address: {
          street: "Av Concorrente",
          street_number: "456",
          neighbourhood: "Centro",
          city: "Sao Paulo",
          state: "SP",
          postcode: "01000-001",
          country: "Brasil",
          display_name: "Av Concorrente 456, Centro, Sao Paulo, SP, Brasil"
        },
        geo: {
          latlon: [-23.551, -46.632],
          source: "nominatim"
        },
        address_city: "Sao Paulo",
        address_state: "SP"
      }
    ]
  };
}

export function productsTemplate(tenantId = "tenant_demo_1") {
  return {
    ...base("products"),
    tenant_id: tenantId,
    items: [
      {
        id: "product_demo_1",
        tenant_id: tenantId,
        internal_reference: "SKU-DEMO-001",
        ean: "7891000100103",
        name: "Produto Exemplo 1",
        description: "Produto de exemplo para carga inicial",
        code_plu: "1001",
        image: {
          provider: "imgbb",
          id: "demo_product_img_1",
          image_url: "https://example.com/product-1.jpg",
          display_url: "https://example.com/product-1-display.jpg",
          thumb_url: "https://example.com/product-1-thumb.jpg",
          medium_url: "https://example.com/product-1-medium.jpg",
          delete_url: "https://example.com/product-1-delete"
        },
        image_url: "https://example.com/product-1.jpg",
        brand: "Marca Demo",
        line: "Linha Demo",
        industry_name: "Industria Demo",
        presentation: "Pacote",
        package_type: "Flexivel",
        package_model: "Flow Pack (Solda de 3 pontos)",
        package_material: "Plastico Laminado (PE/PP)",
        package_format: "Retangular / Almofada",
        package_dimensions_unit: "cm",
        package_dimensions_height: 25,
        package_dimensions_width: 18,
        package_dimensions_depth: 4,
        package_weight_unit: "KG",
        package_gross_weight: 835,
        package_net_weight: 800,
        weight: 1,
        weight_unit: "kg",
        volume: 0.5,
        volume_unit: "L",
        category: "Mercearia"
      }
    ]
  };
}

export function priceResearchesTemplate(
  tenantId = "tenant_demo_1",
  clusterId = "cluster_demo_1"
) {
  return {
    ...base("price_researches"),
    tenant_id: tenantId,
    items: [
      {
        id: "research_demo_1",
        tenant_id: tenantId,
        cluster_id: clusterId,
        name: "Servico Semanal 01",
        status: "ACTIVE",
        start_date: "2026-02-23",
        duration_days: 30,
        is_duration_indefinite: false,
        recurrence_enabled: true,
        recurrence_weekdays: ["TUESDAY"],
        same_product_list_for_all_levels: true,
        default_product_ids: ["product_demo_1"],
        level_product_lists: [
          {
            level_id: "level_1",
            product_ids: ["product_demo_1"]
          },
          {
            level_id: "level_2",
            product_ids: ["product_demo_1"]
          },
          {
            level_id: "level_3",
            product_ids: ["product_demo_1"]
          }
        ]
      }
    ]
  };
}
