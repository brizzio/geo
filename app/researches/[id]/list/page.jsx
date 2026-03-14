import ResearchListPageApp from "../../../../components/research-list-page-app";

export default function ResearchListPage({ params, searchParams }) {
  const rawTaskId = Array.isArray(searchParams?.task) ? searchParams.task[0] : searchParams?.task;
  return (
    <ResearchListPageApp
      researchId={decodeURIComponent(params.id)}
      taskId={rawTaskId ? decodeURIComponent(rawTaskId) : null}
    />
  );
}
