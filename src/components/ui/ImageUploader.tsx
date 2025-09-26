import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faXmark, faImage } from '@fortawesome/free-solid-svg-icons';
import ColorThief from 'colorthief';

interface ImageUploaderProps {
  value?: string;
  onChange: (imageUrl: string, primaryColor?: string) => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorThief = new ColorThief();

  const extractPrimaryColor = (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const dominantColor = colorThief.getColor(img);
          const hexColor = `#${dominantColor.map((c: number) => c.toString(16).padStart(2, '0')).join('')}`;
          resolve(hexColor);
        } catch (error) {
          console.warn('Could not extract color from image:', error);
          resolve('#83a598'); // Fallback to gruvbox blue
        }
      };
      img.onerror = () => {
        resolve('#83a598'); // Fallback color
      };
      img.src = imageUrl;
    });
  };

  const handleFileSelect = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        try {
          const primaryColor = await extractPrimaryColor(result);
          onChange(result, primaryColor);
        } catch (error) {
          console.warn('Error extracting color:', error);
          onChange(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />
      
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative w-10 h-10 rounded-lg cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-gruvbox-blue-bright bg-gruvbox-bg1' 
            : 'border-gruvbox-bg3 hover:border-gruvbox-bg4'
          }
          ${value ? 'bg-transparent' : 'bg-gruvbox-bg1 hover:bg-gruvbox-bg2'}
        `}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Logo du service"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-4 h-4 bg-gruvbox-red hover:bg-gruvbox-red-bright text-gruvbox-fg0 rounded-full flex items-center justify-center transition-colors focus:outline-none"
              title="Supprimer l'image"
            >
              <FontAwesomeIcon icon={faXmark} className="w-2 h-2" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gruvbox-fg4">
            {isDragging ? (
              <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
            ) : (
              <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
