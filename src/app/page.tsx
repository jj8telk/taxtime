import CSVUploader from "./components/CSVUploader";
import ManualEntryForm from "./components/ManualEntryForm";
import TransactionsTable from "./components/TransactionsTable";

export default function Home() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Tax Expense Manager</h1>
      <CSVUploader />
      <ManualEntryForm />
      <TransactionsTable />
    </main>
  );
}
