import StoreFormApp from "../../../../components/store-form-app";

export default function EditStorePage({ params }) {
  return <StoreFormApp mode="edit" storeId={decodeURIComponent(params.id)} />;
}
