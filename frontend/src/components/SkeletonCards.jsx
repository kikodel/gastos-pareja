export default function SkeletonCards() {
  return (
    <div className="grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card skeleton-card" />
      ))}
    </div>
  );
}
