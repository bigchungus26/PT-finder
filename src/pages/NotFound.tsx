import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: '#000' }}
    >
      <div className="text-center">
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(48px, 12vw, 72px)',
            color: '#F5F0E8',
            marginBottom: 8,
          }}
        >
          404
        </h1>
        <p style={{ fontSize: 16, color: '#888', marginBottom: 24 }}>
          This page doesn't exist
        </p>
        <Link
          to="/"
          className="active:scale-[0.96] transition-transform inline-block"
          style={{
            padding: '12px 32px',
            borderRadius: 12,
            background: '#16A34A',
            color: '#000',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
