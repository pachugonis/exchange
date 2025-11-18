import React from 'react';

interface TabsProps {
  tabs: {
    id: string;
    label: string;
    icon?: React.ReactNode;
  }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-dark-200 dark:border-dark-700 ${className}`}>
      <nav className="flex gap-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-dark-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

interface TabPanelProps {
  children: React.ReactNode;
  isActive: boolean;
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, isActive }) => {
  if (!isActive) return null;
  return <div role="tabpanel">{children}</div>;
};
