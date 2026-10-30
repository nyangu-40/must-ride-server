import { useLocation } from 'react-router-dom';

// Dashboards (organizer + platform) are a fixed-height app shell: the sidebar and top bar
// stay put and only the content area scrolls. Public pages keep normal page scrolling.
function Layout({ children }) {
  const { pathname } = useLocation();
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/platform');
  if (isDashboard) {
    return <div className="flex h-[100dvh] flex-col overflow-hidden bg-surface">{children}</div>;
  }
  return (
    <div className="min-h-screen bg-surface px-3 py-4 sm:px-5 sm:py-6 lg:px-6 2xl:px-8">
      <main className="mx-auto mt-2 w-full min-w-0 sm:mt-4">{children}</main>
    </div>
  );
}

export default Layout;
