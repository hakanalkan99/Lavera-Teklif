export type MaterialKey = "MDFLAM" | "HGloss" | "LakPanel" | "Lake";

export type Item = {
  id: string;
  name: string;
  price: number;
  material?: MaterialKey;
};

export type Accessory = {
  accessoryId: string;
  quantity: number;
};

export type Project = {
  id: string;
  name: string;
  customerName: string;
  projectNumber: number;
  currentVersion: string;
  createdAtISO: string;
  items: Item[];
  accessories: Accessory[];
};

export type Settings = {
  materialPrices: Record<MaterialKey, number>;

  accessories: {
    id: string;
    name: string;
    unitPrice: number;
    isActive: boolean;
  }[];

  nextProjectNumber: number;

  doorPrice: number;
  skirtingPricePerMeter: number;
  puffExtraPrice: number;

  companyInfo: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    logoDataUrl?: string;
  };
};