import PriceResearchFormApp from "../../../../components/price-research-form-app";

export default function EditPriceResearchPage({ params }) {
  return <PriceResearchFormApp mode="edit" researchId={decodeURIComponent(params.id)} />;
}
