import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateString);
  };

  const selectedDate = parseDate(value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    onChange(dateString);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getFullYear() === selectedDate.getFullYear() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getDate() === selectedDate.getDate();
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <div ref={datePickerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg flex items-center justify-between transition-colors focus:outline-none ${
          disabled 
            ? 'bg-gruvbox-bg1 text-gruvbox-fg4 opacity-50' 
            : 'bg-gruvbox-bg1 text-gruvbox-fg1 hover:bg-gruvbox-bg2'
        }`}
      >
        <span className={selectedDate ? 'text-gruvbox-fg1' : 'text-gruvbox-fg4'}>
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </span>
        <FontAwesomeIcon icon={faCalendarDays} className={`w-4 h-4 ${disabled ? 'text-gruvbox-fg4' : 'text-gruvbox-fg3'}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 bg-gruvbox-bg0 rounded-lg shadow-xl p-4 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gruvbox-bg1 rounded transition-colors focus:outline-none"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 text-gruvbox-fg2" />
            </button>
            <h3 className="text-gruvbox-fg1 font-normal">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gruvbox-bg1 rounded transition-colors focus:outline-none"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 text-gruvbox-fg2" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm text-gruvbox-fg3 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <button
                key={index}
                type="button"
                onClick={() => date && handleDateSelect(date)}
                disabled={!date}
                className={`
                  h-8 text-sm rounded transition-colors focus:outline-none
                  ${!date ? 'invisible' : ''}
                  ${date && isSelected(date) ? 'bg-gruvbox-blue text-gruvbox-fg0' : ''}
                  ${date && isToday(date) && !isSelected(date) ? 'bg-gruvbox-bg2 text-gruvbox-yellow-bright' : ''}
                  ${date && !isSelected(date) && !isToday(date) ? 'text-gruvbox-fg2 hover:bg-gruvbox-bg1' : ''}
                `}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
