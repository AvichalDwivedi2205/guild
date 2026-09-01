export default function Loading() {
  return (
    <main className="state-page" aria-busy="true" aria-label="Loading Guild">
      <div className="state-card">
        <div className="skeleton" style={{ width: 120, height: 18 }} />
        <div className="skeleton" style={{ width: '82%', height: 36, marginTop: 24 }} />
        <div className="skeleton" style={{ width: '100%', height: 110, marginTop: 18 }} />
      </div>
    </main>
  );
}
