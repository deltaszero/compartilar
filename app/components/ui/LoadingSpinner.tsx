// app/components/ui/LoadingSpinner.tsx
import React from 'react';

export const LoadingSpinner = () => {
  return (
    <div className="w-full flex justify-center items-center py-8">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
};