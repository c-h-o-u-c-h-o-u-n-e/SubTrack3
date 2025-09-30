import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faCode, faGlobe, faEnvelope, faLink } from '@fortawesome/free-solid-svg-icons';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gruvbox-bg0 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/images/logo.png" 
                alt="Logo SubTrack" 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-gruvbox-fg3 leading-relaxed">
              Gérez vos abonnements en toute simplicité. Suivez vos dépenses, 
              recevez des alertes et gardez le contrôle de vos finances.
            </p>
          </div>
        </div>

        {/* Ligne de séparation */}
        <hr className="my-8 border-gruvbox-bg1" />

        {/* Copyright et crédits */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gruvbox-fg3">
            © {currentYear} SubTrack. Tous droits réservés.
          </div>
          <div className="flex items-center space-x-2 text-sm text-gruvbox-fg3">
            <span>Fait avec</span>
            <FontAwesomeIcon icon={faHeart} className="w-4 h-4 text-gruvbox-red-bright" />
            <span>par Charlotte Chapdelaine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
