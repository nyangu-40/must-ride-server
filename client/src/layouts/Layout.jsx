function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface px-3 py-4 sm:px-5 sm:py-6 lg:px-6 2xl:px-8">
      <main className="mx-auto mt-2 w-full min-w-0 sm:mt-4">{children}</main>
    </div>
  );
}

export default Layout;
