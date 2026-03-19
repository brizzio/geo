import UserGroupPermissionsApp from "../../../../../components/user-group-permissions-app";

export default function UserGroupPermissionsPage({ params }) {
  return <UserGroupPermissionsApp groupId={decodeURIComponent(params.groupId)} />;
}
