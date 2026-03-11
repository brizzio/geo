import NetworkFormApp from "../../../../components/network-form-app";

export default function EditNetworkPage({ params }) {
  return <NetworkFormApp mode="edit" networkId={decodeURIComponent(params.id)} />;
}
