export interface FallbackKnowledgeCard {
  id: string;
  keywords: string[];
  title: string;
  summaryVi: string;
  summaryEn: string;
  highlightsVi: string[];
  highlightsEn: string[];
}

export const FALLBACK_KNOWLEDGE_BASE: FallbackKnowledgeCard[] = [
  {
    id: 'protein-prices',
    title: 'Tong quan gia thit pho bien',
    keywords: ['thit', 'thit bo', 'thit heo', 'thit ga', 'meat', 'beef', 'pork', 'chicken'],
    summaryVi:
      'Gia thit tai Viet Nam dao dong do mua vu, nguon cung va chi phi van chuyen. Quy 1/2025: thit bo ta khoang 260k/kg, heo 120k/kg, ga 85k/kg, do huu co cao hon 15-25%.',
    summaryEn:
      'Protein prices in Vietnam shift with harvest cycles and logistics. Q1/2025 averages: local beef 260k VND/kg, pork 120k, chicken 85k, organic options run 15-25% higher.',
    highlightsVi: [
      'Nguon thit bo ganh nang nhap tu Australia, My giup on dinh chat luong.',
      'Nguoi tieu dung quang tam toi chung nhan khong khang sinh va chan nuoi ben vung.',
      'Gia thit dong lanh thuong thap hon 10-15% so voi hang tuoi.',
    ],
    highlightsEn: [
      'Australian and US chilled beef stabilizes supply.',
      'Consumers look for antibiotic-free and traceable farms.',
      'Frozen cuts stay 10-15% cheaper than fresh counter items.',
    ],
  },
  {
    id: 'leafy-greens',
    title: 'Rau la theo mua',
    keywords: ['rau', 'rau xanh', 'rau cu', 'green', 'vegetable', 'spinach', 'lettuce'],
    summaryVi:
      'Rau xanh nhieu dinh duong vao mua mua (thang 5-10) va can giu lanh 6-8 do C. Nen rua nhanh duoi nuoc muoi loang neu khong mua duoc trong he thong.',
    summaryEn:
      'Leafy greens peak in nutrients during the wet season (May-Oct). Keep them at 6-8C and rinse quickly in light salt water when sourcing outside the platform.',
    highlightsVi: [
      'Rau xanh nen duoc dung trong hop hut chan khong de giu do gion.',
      'Huong huu co pho bien: cai xoan, cai chip, rau chan vit.',
      'Nen su dung trong 48h sau thu hoach de tranh mat vitamin.',
    ],
    highlightsEn: [
      'Store greens in vacuum boxes for crunch.',
      'Organic favorites: kale, bok choy, water spinach.',
      'Consume within 48h of harvest to preserve vitamins.',
    ],
  },
  {
    id: 'seafood-choices',
    title: 'Hai san song kho tim',
    keywords: ['hai san', 'ca', 'tom', 'seafood', 'fish', 'shrimp'],
    summaryVi:
      'Nguon hai san tu vung Nam Trung Bo duoc danh gia cao. Tom the chan trang va ca hap (ca chim, ca dieu hong) phu hop cac mon cuoi tuan.',
    summaryEn:
      'South-Central Vietnamese fisheries bring well-rated shrimp and premium snappers for weekend menus.',
    highlightsVi: [
      'Nen uu tien hai san len ke truoc 24h de giu do tuoi.',
      'Ca dong lanh cat khuc can xa tan hoan toan truoc khi uop.',
      'Nau nau nuong nen giu o muc 60-63C de dam bao an toan.',
    ],
    highlightsEn: [
      'Display seafood within 24h of catch for freshness.',
      'Thaw frozen fish completely before marinating.',
      'Cook to 60-63C core temperature for safety.',
    ],
  },
  {
    id: 'spice-pantry',
    title: 'Gia vi nen co',
    keywords: ['gia vi', 'spice', 'herb', 'sa', 'toi', 'ot'],
    summaryVi:
      'Bo gia vi thong minh giup bo tro thit va rau. Nen co toi Ly Son, sa Quang Ngai, ot Hoi An, muoi hong Himalaya de tang huong vi.',
    summaryEn:
      'A smart pantry pairs meats and greens with garlic, lemongrass, heirloom chili, and finishing salts for depth.',
    highlightsVi: [
      'Phu hop de tao goi y neu nguoi dung muon nuong BBQ.',
      'Nen bao quan trong hu thuy tinh tranh am.',
      'Neu thieu toi, co the dung bot toi dong kho nhanh gon.',
    ],
    highlightsEn: [
      'Great for quick BBQ marinades.',
      'Store spices in glass jars away from humidity.',
      'Garlic powder works when fresh bulbs are unavailable.',
    ],
  },
  {
    id: 'meal-prep',
    title: 'Meo so che an sach',
    keywords: ['an sach', 'meal prep', 'an kieng', 'healthy', 'detox'],
    summaryVi:
      'Xu huong an uong 80/20 (80% thuc pham sach, 20% linh hoat) giup giu suc khoe va tiet kiem chi phi. Nen soan san hop thuc don 3 ngay.',
    summaryEn:
      'The 80/20 clean eating trend keeps budgets sane: prep three-day boxes mixing whole foods with comfort add-ons.',
    highlightsVi: [
      'Dung hop thuy tinh ngan voi ron silicone.',
      'Phan chia chat dam, tinh bot, chat xo ro rang trong tin nhan.',
      'Ket hop nuoc ep xanh lam mon phu hop dang detox.',
    ],
    highlightsEn: [
      'Use partitioned glass boxes with silicone lids.',
      'Mention macro balance (protein-carb-fiber) to users.',
      'Suggest green juices as optional detox sides.',
    ],
  },
];