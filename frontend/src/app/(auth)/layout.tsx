export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-secondary to-background p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
