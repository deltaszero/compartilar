'use client';

// Note: The UserProvider is already applied at a higher level (in the app layout)
// This component is just a wrapper for styling and organization

export default function ContentArea({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full h-full overflow-auto">{children}</div>;
}