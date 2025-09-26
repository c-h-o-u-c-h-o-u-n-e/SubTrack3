import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faEnvelope, faLock, faFloppyDisk, faUser } from '@fortawesome/free-solid-svg-icons';

interface ProfileModalProps {
  onClose: () => void;
}

interface UserProfile {
  email: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const [profile, setProfile] = useState<UserProfile>({
    email: 'utilisateur@example.com'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  // Disable background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Load profile from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      // Migrate old profile format to new format
      const newProfile = {
        email: parsedProfile.email || 'utilisateur@example.com'
      };
      setProfile(newProfile);
      setEditedProfile(newProfile);
    }
  }, []);

  const handleSave = () => {
    setProfile(editedProfile);
    localStorage.setItem('userProfile', JSON.stringify(editedProfile));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    // Placeholder for password change functionality
    alert('La modification du mot de passe nécessite une intégration backend. Cette fonctionnalité sera disponible avec Supabase.');
  };

  return (
    <div className="fixed inset-0 bg-gruvbox-bg0-hard bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gruvbox-bg0 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 rounded-t-xl relative bg-gruvbox-blue-bright">
          {/* Matte overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-t-xl"></div>
          
          {/* Gradient overlay */}
          <div 
            className="absolute inset-0 rounded-t-xl"
            style={{
              background: `linear-gradient(to right, rgba(22, 24, 25, 0.4) 0%, rgba(22, 24, 25, 0.6) 50%, rgba(22, 24, 25, 0.4) 100%)`
            }}
          ></div>
          
          {/* Content */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-gruvbox-fg0" />
              <h2 className="text-lg font-normal text-gruvbox-fg0">Profil utilisateur</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gruvbox-fg0 hover:text-gruvbox-fg0 opacity-80 hover:opacity-100 rounded-lg transition-all focus:outline-none"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Information */}
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm text-gruvbox-fg2 mb-2">Courriel</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-gruvbox-bg1 text-gruvbox-fg1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-gruvbox-blue-bright"
                />
              ) : (
                <div className="flex items-center space-x-2 px-3 py-2 bg-gruvbox-bg1 rounded-lg">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gruvbox-fg3" />
                  <span className="text-gruvbox-fg1">{profile.email}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gruvbox-fg2 mb-2">Mot de passe</label>
              <div className="flex items-center justify-between px-3 py-2 bg-gruvbox-bg1 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faLock} className="w-4 h-4 text-gruvbox-fg3" />
                  <span className="text-gruvbox-fg1">••••••••</span>
                </div>
                <button
                  onClick={handleChangePassword}
                  className="text-sm text-gruvbox-blue-bright hover:text-gruvbox-blue transition-colors focus:outline-none"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gruvbox-bg2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-normal text-gruvbox-fg2 bg-gruvbox-bg1 rounded-lg hover:bg-gruvbox-bg2 transition-colors focus:outline-none"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-normal text-gruvbox-fg0 bg-gruvbox-blue rounded-lg hover:bg-gruvbox-blue-bright transition-colors focus:outline-none"
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
                <span>Enregistrer</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
