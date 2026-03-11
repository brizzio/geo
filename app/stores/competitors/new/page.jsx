import StoreFormApp from "../../../../components/store-form-app";
import { STORE_KINDS } from "../../../../features/domain/models";

export default function NewCompetitorStorePage() {
  return <StoreFormApp mode="create" defaultKind={STORE_KINDS.COMPETITOR} lockKind />;
}
