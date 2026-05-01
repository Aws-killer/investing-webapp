const STOCK_LOGOS = {
  CRDB: "/stocks/logos/CRDB.jpg",
  DCB: "/stocks/logos/DCB.jpeg",
  DSE: "/stocks/logos/DSE.png",
  EABL: "/stocks/logos/EABL.jpg",
  JATU: "/stocks/logos/JATU.png",
  JHL: "/stocks/logos/JHL.jpg",
  KA: "/stocks/logos/KA.jpg",
  KCB: "/stocks/logos/KCB.png",
  MBP: "/stocks/logos/MBP.png",
  MCB: "/stocks/logos/MCB.png",
  MKCB: "/stocks/logos/MKCB.png",
  MUCOBA: "/stocks/logos/MUCOBA.png",
  NICO: "/stocks/logos/NICO.png",
  NMB: "/stocks/logos/NMB.png",
  NMG: "/stocks/logos/NMG.png",
  PAL: "/stocks/logos/PAL.jpg",
  SWALA: "/stocks/logos/SWALA.png",
  SWIS: "/stocks/logos/SWIS.png",
  TBL: "/stocks/logos/TBL.jpg",
  TCC: "/stocks/logos/TCC.png",
  TCCL: "/stocks/logos/TCCL.jpg",
  TICL: "/stocks/logos/TICL.png",
  TOL: "/stocks/logos/TOL.jpg",
  TPCC: "/stocks/logos/TPCC.png",
  TTP: "/stocks/logos/TTP.jpg",
  USL: "/stocks/logos/USL.jpg",
  VODA: "/stocks/logos/VODA.jpg",
  YETU: "/stocks/logos/YETU.png",
};

export const getStockLogoUrl = (symbol, fallbackUrl) => {
  const normalized = String(symbol || "").trim().toUpperCase();
  return STOCK_LOGOS[normalized] || fallbackUrl || null;
};

export default STOCK_LOGOS;
