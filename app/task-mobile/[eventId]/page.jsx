import MobileTaskExecutionApp from "../../../components/mobile-task-execution-app";

export default function TaskMobilePage({ params }) {
  return <MobileTaskExecutionApp eventId={decodeURIComponent(params.eventId)} />;
}
