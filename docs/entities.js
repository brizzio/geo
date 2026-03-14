// Fluxo de execucao da pesquisa:
// research_service -> research_schedule -> research_task -> research_item[]

var research_service = {
  id: "research_service_xxx",
  tenant_id: "tenant_xxx",
  cluster_id: "cluster_xxx",
  name: "Pesquisa semanal leite UHT",
  status: "ACTIVE", // ACTIVE | SUSPENDED
  start_date: "2026-03-14", // yyyy-mm-dd
  duration_days: 30, // null quando is_duration_indefinite = true
  is_duration_indefinite: false,
  recurrence_enabled: true,
  recurrence_weekdays: ["TUESDAY"], // MONDAY..SUNDAY
  same_product_list_for_all_levels: false,
  default_product_ids: ["product_1", "product_2"],
  level_product_lists: [
    { level_id: "level_1", product_ids: ["product_1", "product_2"] },
    { level_id: "level_2", product_ids: ["product_3"] }
  ]
};

var research_schedule = {
  id: "research_schedule_xxx",
  tenant_id: "tenant_xxx",
  research_service_id: "research_service_xxx",
  cluster_id: "cluster_xxx",
  level_id: "level_1",
  date: "2026-03-18", // yyyy-mm-dd
  place_id: "store_competitor_xxx",
  status: "PENDING", // PENDING | IN_PROGRESS | DONE | CANCELLED
  due_date: "2026-03-18", // yyyy-mm-dd
  list_id: "list_research_service_xxx_level_1",
  list_items_count: 12,
  value: 200, // default
  research_task_id: "research_task_xxx"
};

var research_task = {
  id: "research_task_xxx",
  tenant_id: "tenant_xxx",
  research_service_id: "research_service_xxx",
  research_schedule_id: "research_schedule_xxx",
  cluster_id: "cluster_xxx",
  level_id: "level_1",
  date: "18/03/2026", // dd/mm/yyyy
  start_time: "09:00", // hh:mm
  end_time: "10:15", // hh:mm
  place_id: "store_competitor_xxx",
  research_place_lat: -23.5676,
  research_place_lon: -46.6507,
  status: "pending", // pending | in_progress | done
  research_list: [research_item, research_item]
};

var research_item = {
  id: "research_item_xxx",
  research_task_id: "research_task_xxx",
  product_id: "product_1",
  product_name: "Leite UHT Integral 1L",
  product_ean: "7890000000000",
  collected_time: "18/03/2026 09:25", // dd/mm/yyyy hh:mm
  collected_promotion_label: "Leve 3 pague 2",
  collected_stock: "available",
  collected_brand: "Marca X",
  collected_department: "Mercearia",
  collected_section: "Leites",
  found: true,
  collected_currency: "BRL",
  collected_retail_unit_price: 6.99,
  collected_wholesale_price: 6.49,
  collected_wholesale_quantity: 12,
  collected_promotion: true,
  collected_image: "https://.../foto-item.jpg",
  status: "collected" // pending | collected | not_found
};
