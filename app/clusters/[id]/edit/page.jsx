import ClusterFormApp from "../../../../components/cluster-form-app";

export default function EditClusterPage({ params }) {
  return <ClusterFormApp mode="edit" clusterId={decodeURIComponent(params.id)} />;
}
