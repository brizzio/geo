import ProductFormApp from "../../../../components/product-form-app";

export default function CloneProductPage({ params }) {
  return <ProductFormApp mode="clone" productId={decodeURIComponent(params.id)} />;
}
