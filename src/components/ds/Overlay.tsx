export function Overlay({ onClick }: { onClick: () => void }) {
  return <div className="fixed inset-0 z-10" onClick={onClick} />;
}
