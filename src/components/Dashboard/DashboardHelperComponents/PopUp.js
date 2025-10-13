import React from 'react';

const PopUp = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  icon, 
  iconColor = "green",
  children, 
  primaryButton, 
  secondaryButton,
  maxWidth = "max-w-md"
}) => {
  if (!isOpen) return null;

  const getIconColorClasses = (color) => {
    switch (color) {
      case 'green':
        return 'text-green-500 border-green-500';
      case 'red':
        return 'text-red-500 border-red-500';
      case 'blue':
        return 'text-blue-500 border-blue-500';
      case 'yellow':
        return 'text-yellow-500 border-yellow-500';
      default:
        return 'text-green-500 border-green-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      {/* Modal Content */}
      <div className={`relative bg-white rounded-2xl shadow-lg ${maxWidth} w-full mx-4`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex flex-col items-start">
            {icon && (
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-4 ${getIconColorClasses(iconColor)}`}>
                {icon}
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
            {subtitle && (
              <p className="text-gray-600 text-sm">{subtitle}</p>
            )}
          </div>
          <button
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        {children && (
          <div className="p-6">
            {children}
          </div>
        )}

        {/* Action Buttons */}
        {(primaryButton || secondaryButton) && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            {secondaryButton && (
              <button
                onClick={secondaryButton.onClick}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {secondaryButton.text}
              </button>
            )}
            {primaryButton && (
              <button
                onClick={primaryButton.onClick}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {primaryButton.text}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PopUp;
