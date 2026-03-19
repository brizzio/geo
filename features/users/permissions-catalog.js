export const APP_ROUTE_PERMISSIONS = [
  { key: "dashboard", name: "Dashboard", path: "/dashboard" },
  { key: "accounts", name: "Conta", path: "/accounts" },
  { key: "users", name: "Times", path: "/users" },
  { key: "networks", name: "Redes", path: "/networks" },
  { key: "banners", name: "Bandeiras", path: "/banners" },
  { key: "stores", name: "Lojas", path: "/stores" },
  { key: "competitors", name: "Concorrentes", path: "/competitors" },
  { key: "clusters", name: "Clusters", path: "/clusters" },
  { key: "researches", name: "Pesquisas", path: "/researches" },
  { key: "products", name: "Produtos", path: "/products" },
  { key: "map", name: "Mapa", path: "/map" },
  { key: "database", name: "Banco de dados", path: "/database" }
];

export function createDefaultPermissions() {
  return APP_ROUTE_PERMISSIONS.map((item) => ({
    route_key: item.key,
    route_name: item.name,
    route_path: item.path,
    can_view: false,
    can_create: false,
    can_edit: false,
    can_delete: false
  }));
}

