import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  label,
  className = '',
  disabled = false
}) => {
  return (
    <label className={`flex items-center space-x-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            w-4 h-4 rounded border-0 transition-all duration-200 flex items-center justify-center
            ${checked 
              ? 'bg-gruvbox-blue text-gruvbox-fg0' 
              : 'bg-gruvbox-bg1 hover:bg-gruvbox-bg2'
            }
            ${!disabled && 'hover:scale-105'}
          `}
        >
          {checked && (
            <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-gruvbox-fg0" />
          )}
        </div>
      </div>
      {label && (
        <span className="text-sm font-normal text-gruvbox-fg2 select-none">
          {label}
        </span>
      )}
    </label>
  );
};
