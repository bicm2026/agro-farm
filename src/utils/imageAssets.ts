import heroAgroFarm from '../assets/images/hero_agro_farm_1790145662591.jpg';
import heroFarm from '../assets/images/hero_farm.jpg';
import sectorDuckFarm from '../assets/images/sector_duck_farm_1790145674441.jpg';
import sectorDuck from '../assets/images/sector_duck.jpg';
import sectorPoultryChicken from '../assets/images/sector_poultry_chicken_1790145686089.jpg';
import sectorPoultry from '../assets/images/sector_poultry.jpg';
import sectorGoatFarm from '../assets/images/sector_goat_farm_1790145697618.jpg';
import sectorGoat from '../assets/images/sector_goat.jpg';
import sectorVegetableFarm from '../assets/images/sector_vegetable_farm_1790145709487.jpg';
import sectorVegetable from '../assets/images/sector_vegetable.jpg';
import logoPng from '../assets/images/logo.png';
import logoSvg from '../assets/images/logo.svg';
import logoJpg from '../assets/images/logo.jpg';
import ahmadunLogo from '../assets/images/ahmadun_agro_logo_1790255433507.jpg';

export const APP_IMAGES = {
  logo: logoPng,
  logoSvg: logoSvg,
  logoJpg: logoJpg,
  hero: heroAgroFarm,
  heroFallback: heroFarm,
  sectorDuck: sectorDuckFarm,
  sectorDuckFallback: sectorDuck,
  sectorPoultry: sectorPoultryChicken,
  sectorPoultryFallback: sectorPoultry,
  sectorGoat: sectorGoatFarm,
  sectorGoatFallback: sectorGoat,
  sectorVegetable: sectorVegetableFarm,
  sectorVegetableFallback: sectorVegetable,
  ahmadunLogo: ahmadunLogo,
};

/**
 * Resolves any image path or fallback to Vite-bundled asset URLs.
 * This guarantees that images work on Vercel, GitHub Pages, Netlify, or any static host
 * because Vite processes and bundles imported assets with proper content hashing.
 */
export function resolveFarmImage(pathOrUrl: string | undefined): string {
  if (!pathOrUrl) return APP_IMAGES.hero;

  // External URLs or base64 / blob data
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl;
  }

  const clean = pathOrUrl.toLowerCase();

  if (clean.includes('duck')) return APP_IMAGES.sectorDuck;
  if (clean.includes('poultry') || clean.includes('chicken')) return APP_IMAGES.sectorPoultry;
  if (clean.includes('goat')) return APP_IMAGES.sectorGoat;
  if (clean.includes('vegetable') || clean.includes('crop')) return APP_IMAGES.sectorVegetable;
  if (clean.includes('logo')) {
    if (clean.endsWith('.svg')) return APP_IMAGES.logoSvg;
    return APP_IMAGES.logo;
  }
  if (clean.includes('hero') || clean.includes('farm') || clean.includes('agro')) {
    return APP_IMAGES.hero;
  }

  return pathOrUrl;
}
