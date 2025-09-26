import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-gruvbox-bg1 text-gruvbox-fg1 rounded-lg border-0 flex items-center justify-between hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
      >
        <span className={selectedOption ? 'text-gruvbox-fg1' : 'text-gruvbox-fg4'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FontAwesomeIcon 
          icon={faChevronDown}
          className={`w-4 h-4 text-gruvbox-fg3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gruvbox-bg0 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2 text-left hover:bg-gruvbox-bg1 transition-colors focus:outline-none ${
                  option.value === value 
                    ? 'bg-gruvbox-bg1 text-gruvbox-blue-bright' 
                    : 'text-gruvbox-fg1'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
