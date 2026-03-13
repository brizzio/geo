import AccountFormApp from "../../../../components/account-form-app";

export default function EditAccountPage({ params }) {
  return <AccountFormApp mode="edit" accountId={decodeURIComponent(params.id)} />;
}
