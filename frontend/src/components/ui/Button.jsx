export default function Button({
  children,
  variant = "primary",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition text-sm whitespace-nowrap";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    success: "bg-green-600 text-white hover:bg-green-700",
  };

  return (
    <button className={`${base} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}
