import { Link } from "react-router-dom";

export default function Property() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Property Page</h1>
      <p className="text-gray-600">This page is a placeholder for property routes. Please go to the dashboard and click a property card to view details.</p>
      <Link to="/dashboard" className="inline-flex items-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
        Back to Dashboard
      </Link>
    </div>
  );
}
