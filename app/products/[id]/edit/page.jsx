import ProductFormApp from "../../../../components/product-form-app";

export default function EditProductPage({ params }) {
  return <ProductFormApp mode="edit" productId={decodeURIComponent(params.id)} />;
}
