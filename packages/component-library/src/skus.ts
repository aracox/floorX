export interface ProductSku {
  id: string;
  barcode: string;
  name: string;
  nameTh: string;
  brand: string;
  category: 'sauces' | 'rice-grains' | 'staples' | 'canned-dairy' | 'bulk';
  dimensions: {
    width: number;  // meters
    depth: number;  // meters
    height: number; // meters
  };
  packaging: 'tub' | 'bottle' | 'can' | 'box' | 'bag';
  appearance: {
    primaryColor: string;
    secondaryColor?: string;
    accentColor?: string;
  };
  imageUrl?: string;
  defaultFacing?: number;
  defaultStack?: number;
  defaultDepth?: number;
  recommendedTier?: number; // 0-indexed: 0 is bottom
}

export interface PlacedSkuItem {
  skuId: string;
  facings: number; // units wide
  stack: number;   // units high
  depth: number;   // units deep
}

export interface TierPlanogram {
  tierIndex: number;
  items: PlacedSkuItem[];
}

export const makroSkuCatalog: ProductSku[] = [
  {
    id: 'sku-aro-gochujang-500g',
    barcode: '8851007010214',
    name: 'aro Korean Gochujang 500g',
    nameTh: 'เอโร่ โคชูจัง ซอสพริกเกาหลี 500 กรัม',
    brand: 'aro',
    category: 'sauces',
    dimensions: { width: 0.14, depth: 0.10, height: 0.085 },
    packaging: 'tub',
    appearance: { primaryColor: '#dc2626', secondaryColor: '#eab308' },
    imageUrl: '/skus/aro-gochujang-500g.jpg',
    defaultFacing: 1,
    defaultStack: 2,
    defaultDepth: 3,
    recommendedTier: 2,
  },
  {
    id: 'sku-aro-ssamjang-500g',
    barcode: '8851007010221',
    name: 'aro Korean Ssamjang 500g',
    nameTh: 'เอโร่ ซัมจัง น้ำพริกปรุงรสเกาหลี 500 กรัม',
    brand: 'aro',
    category: 'sauces',
    dimensions: { width: 0.14, depth: 0.10, height: 0.085 },
    packaging: 'tub',
    appearance: { primaryColor: '#16a34a', secondaryColor: '#15803d' },
    imageUrl: '/skus/aro-ssamjang-500g.jpg',
    defaultFacing: 1,
    defaultStack: 2,
    defaultDepth: 3,
    recommendedTier: 2,
  },
  {
    id: 'sku-aro-doenjang-500g',
    barcode: '8851007010238',
    name: 'aro Korean Doenjang 500g',
    nameTh: 'เอโร่ เดนจัง เต้าเจี้ยวเกาหลี 500 กรัม',
    brand: 'aro',
    category: 'sauces',
    dimensions: { width: 0.14, depth: 0.10, height: 0.085 },
    packaging: 'tub',
    appearance: { primaryColor: '#92400e', secondaryColor: '#d97706' },
    imageUrl: '/skus/aro-doenjang-500g.png',
    defaultFacing: 1,
    defaultStack: 2,
    defaultDepth: 3,
    recommendedTier: 1,
  },
  {
    id: 'sku-aro-gochujang-tin-3kg',
    barcode: '8851007005425',
    name: 'aro Catering Gochujang Tin 3kg',
    nameTh: 'เอโร่ โคชูจัง ปี๊บสี่เหลี่ยม 3 กก.',
    brand: 'aro',
    category: 'bulk',
    dimensions: { width: 0.18, depth: 0.18, height: 0.22 },
    packaging: 'can',
    appearance: { primaryColor: '#991b1b', secondaryColor: '#10b981', accentColor: '#cbd5e1' },
    imageUrl: '/skus/aro-gochujang-tin-3kg.png',
    defaultFacing: 1,
    defaultStack: 1,
    defaultDepth: 2,
    recommendedTier: 0,
  },
  {
    id: 'sku-tiparos-fish-sauce-700ml',
    barcode: '8850124001152',
    name: 'Tiparos Pure Fish Sauce 700ml',
    nameTh: 'น้ำปลาแท้ตราทิพรส 700 มล.',
    brand: 'Tiparos',
    category: 'sauces',
    dimensions: { width: 0.075, depth: 0.075, height: 0.28 },
    packaging: 'bottle',
    appearance: { primaryColor: '#b91c1c', secondaryColor: '#f59e0b', accentColor: '#78350f' },
    imageUrl: '/skus/tiparos-fish-sauce.jpg',
    defaultFacing: 1,
    defaultStack: 1,
    defaultDepth: 4,
    recommendedTier: 3,
  },
  {
    id: 'sku-deksomboon-soy-sauce-700ml',
    barcode: '8850020101116',
    name: 'Deksomboon Soy Sauce Formula 1 700ml',
    nameTh: 'ซีอิ๊วขาวสูตร 1 ตราเด็กสมบูรณ์ 700 มล.',
    brand: 'Deksomboon',
    category: 'sauces',
    dimensions: { width: 0.075, depth: 0.075, height: 0.28 },
    packaging: 'bottle',
    appearance: { primaryColor: '#eab308', secondaryColor: '#dc2626', accentColor: '#1e293b' },
    imageUrl: '/skus/deksomboon-soy-sauce.jpg',
    defaultFacing: 1,
    defaultStack: 1,
    defaultDepth: 4,
    recommendedTier: 3,
  },
  {
    id: 'sku-aro-palm-oil-1l',
    barcode: '8850188800104',
    name: 'aro 100% Palm Cooking Oil 1L',
    nameTh: 'เอโร่ น้ำมันปาล์มบริสุทธิ์ 1 ลิตร',
    brand: 'aro',
    category: 'staples',
    dimensions: { width: 0.082, depth: 0.082, height: 0.26 },
    packaging: 'bottle',
    appearance: { primaryColor: '#f59e0b', secondaryColor: '#16a34a' },
    imageUrl: '/skus/aro-palm-oil.jpg',
    defaultFacing: 1,
    defaultStack: 1,
    defaultDepth: 4,
    recommendedTier: 1,
  },
  {
    id: 'sku-aro-jasmine-rice-5kg',
    barcode: '8850188231014',
    name: 'aro Jasmine Rice 100% 5kg',
    nameTh: 'เอโร่ ข้าวหอมมะลิแท้ 100% 5 กก.',
    brand: 'aro',
    category: 'rice-grains',
    dimensions: { width: 0.26, depth: 0.12, height: 0.36 },
    packaging: 'bag',
    appearance: { primaryColor: '#f8fafc', secondaryColor: '#dc2626', accentColor: '#eab308' },
    imageUrl: '/skus/aro-jasmine-rice.jpg',
    defaultFacing: 1,
    defaultStack: 1,
    defaultDepth: 2,
    recommendedTier: 0,
  },
  {
    id: 'sku-mama-tomyum-box-30',
    barcode: '8850987101019',
    name: 'Mama Tom Yum Noodles (Box 30)',
    nameTh: 'มาม่า บะหมี่กึ่งสำเร็จรูป รสต้มยำกุ้ง กล่อง 30 ซอง',
    brand: 'Mama',
    category: 'staples',
    dimensions: { width: 0.32, depth: 0.20, height: 0.15 },
    packaging: 'box',
    appearance: { primaryColor: '#ea580c', secondaryColor: '#fbbf24' },
    imageUrl: '/skus/mama-tomyum.jpg',
    defaultFacing: 1,
    defaultStack: 2,
    defaultDepth: 2,
    recommendedTier: 1,
  },
  {
    id: 'sku-carnation-condensed-milk-388g',
    barcode: '8850125010017',
    name: 'Carnation Condensed Milk 388g',
    nameTh: 'นมข้นหวานตราคาร์เนชัน 388 กรัม',
    brand: 'Carnation',
    category: 'canned-dairy',
    dimensions: { width: 0.075, depth: 0.075, height: 0.08 },
    packaging: 'can',
    appearance: { primaryColor: '#ffffff', secondaryColor: '#dc2626', accentColor: '#cbd5e1' },
    imageUrl: '/skus/carnation-condensed-milk.jpg',
    defaultFacing: 1,
    defaultStack: 2,
    defaultDepth: 4,
    recommendedTier: 2,
  },
];

export function findProductSku(id: string): ProductSku | undefined {
  return makroSkuCatalog.find((sku) => sku.id === id);
}
