export default function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 
      shadow-sm hover:shadow-md transition-shadow duration-200 
      p-4 sm:p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
