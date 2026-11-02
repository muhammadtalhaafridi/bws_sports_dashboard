import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui";

export function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      text="This page does not exist."
      action={
        <Link to="/" className="btn btn-primary btn-sm">
          Go to overview
        </Link>
      }
    />
  );
}
