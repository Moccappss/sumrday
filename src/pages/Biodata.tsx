import React, { useState, useEffect } from 'react';
import PageRenderer from '../components/PageRenderer';

interface BiodataProps {
  isPublished?: boolean;
}

const Biodata: React.FC<BiodataProps> = ({ isPublished = true }) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const onStorage = () => forceUpdate(n => n + 1);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!isPublished) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Halaman ini sedang di-arsip.
      </div>
    );
  }

  return <PageRenderer pageKey="biodata" />;
};

export default Biodata;
