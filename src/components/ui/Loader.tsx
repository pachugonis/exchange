import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-primary-500 border-t-transparent ${sizes[size]} ${className}`}
    />
  );
};

interface SpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ text, fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader size="lg" />
      {text && (
        <p className="text-dark-600 dark:text-dark-400 font-medium">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{content}</div>;
};
