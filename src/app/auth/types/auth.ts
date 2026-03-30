export interface AuthProfile {
  id: string;
  email: string | null;
  is_premium: boolean;
  premium_until: string | null;
}

export interface RedeemPremiumCodeResponse {
  success: boolean;
  message?: string;
  premium_until?: string | null;
}
