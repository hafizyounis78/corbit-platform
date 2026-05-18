"use client";

import {
  SiSalla,
  SiShopify,
  SiHubspot,
  SiZapier,
  SiGooglesheets,
  SiSalesforce,
  SiStripe,
  SiSlack,
} from "react-icons/si";
import type { IconType } from "react-icons";

const BRAND_MAP: Record<string, IconType> = {
  salla: SiSalla,
  shopify: SiShopify,
  hubspot: SiHubspot,
  zapier: SiZapier,
  sheets: SiGooglesheets,
  google_sheets: SiGooglesheets,
  salesforce: SiSalesforce,
  stripe: SiStripe,
  slack: SiSlack,
};

interface Props {
  name: string;
  size?: number;
  color?: string;
}

export function BrandIcon({ name, size = 24, color }: Props) {
  const Comp = BRAND_MAP[name];
  if (!Comp) return null;
  return <Comp size={size} color={color} />;
}
