function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface py-6 px-4 sm:px-6 lg:px-8">
      <main className="mx-auto mt-8 max-w-6xl">{children}</main>
    </div>
  );
}

export default Layout;
