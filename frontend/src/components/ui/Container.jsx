export default function Container({ children, className = "" }) {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {children}
    </div>
  );
}
