import { getImageUrl } from './imageUrl';

export const COMPANY_LOGO = '/brand/company-logo.jpeg';

// The original installation used only the P. symbol. The flyer needs the
// supplied full company image; custom logos saved in Settings still take priority.
export function getCompanyLogoUrl(value) {
  if (!value || /(?:^|\/)company-mark\.jpeg$|\/uploads\/logo\/logo\.jpeg$/.test(value)) return COMPANY_LOGO;
  return getImageUrl(value);
}
