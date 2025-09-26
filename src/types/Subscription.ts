export interface Subscription {
  id: string;
  name: string;
  category: Category;
  amount: number;
  currency: string;
  frequency: Frequency;
  startDate: string;
  nextBilling: string;
  isTrialPeriod: boolean;
  trialEndDate?: string;
  paymentMethod: string;
  url?: string;
  logoUrl?: string;
  notes?: string;
  status: SubscriptionStatus;
  reminderEnabled: boolean;
  primaryColor?: string;
  createdAt: string;
  updatedAt: string;
  isAutomaticPayment: boolean;
  paymentHistory?: PaymentRecord[];
  // Champs pour suivre les modifications
  paymentMethodUpdatedAt?: string;
  frequencyUpdatedAt?: string;
  categoryUpdatedAt?: string;
  amountUpdatedAt?: string;
  startDateUpdatedAt?: string;
  nextBillingUpdatedAt?: string;
  urlUpdatedAt?: string;
  logoUpdatedAt?: string;
  reactivatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  recordedDate: string;
  status: 'pending' | 'confirmed';
  isAdjusted: boolean;
  originalAmount?: number;
}

export type Category = 
  | 'alimentation'
  | 'alimentation_animaux'
  | 'applications_productivite'
  | 'assurance_automobile'
  | 'assurance_habitation'
  | 'assurance_sante'
  | 'assurance_voyage'
  | 'assurances_animaux'
  | 'baladodiffusions'
  | 'cine_clubs'
  | 'clubs_sport'
  | 'clubs_voyage'
  | 'clubs_communautes'
  | 'commerce_en_ligne'
  | 'compagnies_aeriennes'
  | 'conception_graphique'
  | 'concerts_operas'
  | 'cours_en_ligne'
  | 'cryptomonnaies'
  | 'creation_musicale'
  | 'cybersecurite'
  | 'divertissements_adultes'
  | 'eau'
  | 'edition_photo_videos'
  | 'electricite'
  | 'entreposage'
  | 'entretien_domestique'
  | 'formations_professionnelles'
  | 'frais_bancaires'
  | 'garde_animaux'
  | 'garde_enfants'
  | 'gaz'
  | 'gestion_entreprise'
  | 'gestion_financiere'
  | 'hebergement_en_ligne'
  | 'hebergement_infonuagique'
  | 'hebergement_touristique'
  | 'intelligence_artificielle'
  | 'internet'
  | 'investissements_boursiers'
  | 'jeux_videos'
  | 'journaux_magazines'
  | 'livres_audio'
  | 'livres_numeriques'
  | 'location_equipements'
  | 'location_vetements'
  | 'magazines_numeriques'
  | 'maison_connectee'
  | 'mise_en_forme'
  | 'mode_vetements'
  | 'musique_en_continu'
  | 'musees_galeries'
  | 'meditation'
  | 'programmation'
  | 'programmes_fidelite'
  | 'protection_juridique'
  | 'publicite'
  | 'rencontres_vie_amoureuse'
  | 'reapprovisionnement'
  | 'services_automobiles'
  | 'services_courriels'
  | 'services_postaux'
  | 'soins_animaux'
  | 'soins_bebe'
  | 'soutien_createurs'
  | 'suivi_sante'
  | 'securite_residentielle'
  | 'selections_personnalisees'
  | 'therapie_coaching'
  | 'theatre_spectacles'
  | 'transports_urbains'
  | 'telephonie'
  | 'television'
  | 'videos_en_continu';

export interface CategorySettings {
  [key: string]: {
    label: string;
    enabled: boolean;
  };
}

export type Frequency = 
  | 'weekly'
  | 'biweekly'
  | 'monthly' 
  | 'yearly';

export type SubscriptionStatus = 
  | 'active'
  | 'cancelled' 
  | 'trial';

export interface Alert {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  type: 'renewal' | 'trial_ending' | 'expiring';
  daysRemaining: number;
  amount: number;
  currency: string;
  urgency: 'low' | 'medium' | 'high';
  snoozedUntil?: string;
  primaryColor?: string;
  nextBillingDate?: string; // Date of the next billing after trial ends
}
