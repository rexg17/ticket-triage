/** Confiança como uma régua de traços, no estilo de um termômetro de bancada. */
export default function Gauge({ value }: { value: number }) {
  const ticks = 20;
  const lit = Math.round((value / 100) * ticks);
  return (
    <div className="gauge" role="img" aria-label={`Confidence ${value} percent`}>
      <div className="gauge-ticks">
        {Array.from({ length: ticks }, (_, i) => (
          <span key={i} className={i < lit ? "on" : ""} />
        ))}
      </div>
      <div className="gauge-label">
        <span>unsure</span>
        <strong>{value}%</strong>
        <span>sure</span>
      </div>
    </div>
  );
}
