export default function Badge({ children }) {
  return (
    <span className="
      inline-block 
      text-xs 
      font-medium 
      px-3 py-1 
      rounded-full 
      bg-gray-100 
      text-gray-600
    ">
      {children}
    </span>
  );
}
