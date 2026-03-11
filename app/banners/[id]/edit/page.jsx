import BannerFormApp from "../../../../components/banner-form-app";

export default function EditBannerPage({ params }) {
  return <BannerFormApp mode="edit" bannerId={decodeURIComponent(params.id)} />;
}
