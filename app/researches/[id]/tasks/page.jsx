import ResearchTaskPageApp from "../../../../components/research-task-page-app";

export default function ResearchTasksPage({ params }) {
  return <ResearchTaskPageApp researchId={decodeURIComponent(params.id)} />;
}
