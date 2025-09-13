import React from 'react';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <div className="mx-auto w-12 h-12 mb-4 text-gray-400">
          <Icon className="w-full h-full" />
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && action}
    </div>
  );
};

export default EmptyState;
