import RealPharmacyBill from './RealPharmacyBill';
import RealMedical from './RealMedical';
import RealRestaurantThermal from './RealRestaurantThermal';
import RealGrocery from './RealGrocery';
import RealElectronics from './RealElectronics';
import RealClothing from './RealClothing';
import RealGeneralStore from './RealGeneralStore';
import MedicalPro from './MedicalPro';
import GmedMedicalA4 from './GmedMedicalA4';
import FoodDineIn from './FoodDineIn';
import FastRetail from './FastRetail';
import TechWarranty from './TechWarranty';
import FashionStyle from './FashionStyle';
import ThermalSmall from './ThermalSmall';
import GeneralStoreA4 from './GeneralStoreA4';
import ServicePro from './ServicePro';
import A4Invoice from './A4Invoice';
import LargeA4 from './LargeA4';
import StandardTaxInvoice from './StandardTaxInvoice';
import ModernBlue from './ModernBlue';
import ClassicSharp from './ClassicSharp';
import CompactFoodie from './CompactFoodie';
import EducationStandard from './EducationStandard';
import ConsultingPro from './ConsultingPro';
import MedicalStoreReal from './MedicalStoreReal';
import GroceryStoreReal from './GroceryStoreReal';
import UniversalBillEngine from './UniversalBillEngine';
import './InvoiceTemplates.css';

/**
 * Advanced Template Resolver
 * Centralizes all specialized industry layouts
 */
export const getBillingTemplate = (id) => {
    switch (id) {
        case '1':
        case 'default':
        case 'modern_blue': 
            return ModernBlue;
            
        case '2':
        case 'grocery_real': 
            return GroceryStoreReal;
            
        case 'grocery':
            return RealGrocery;
            
        case '3':
        case 'service_pro':
        case 'professional_a4':
            return ServicePro;
            
        case 'medical_real':
            return MedicalStoreReal;
            
        case '4':
        case 'medical':
            return RealMedical;
            
        case 'pharmacy_indian':
        case 'pharmacy':
            return RealPharmacyBill;
            
        case '5':
        case 'education':
        case 'school':
            return EducationStandard;
            
        case 'clothing_real':
        case 'clothing':
        case 'boutique':
            return RealClothing;
            
        case '6':
        case 'consulting_pro':
        case 'consulting':
        case 'professional':
            return ConsultingPro;
            
        case 'electronics_real':
            return ServicePro;

        case 'restaurant_real': 
        case 'restaurant':
            return RealRestaurantThermal;
            
        case 'general_real': return RealGeneralStore;
        case 'medical_pro': return MedicalPro;
        case 'medical_a4': return GmedMedicalA4;
        case 'food_dine_in': return FoodDineIn;
        case 'fast_retail': return FastRetail;
        case 'tech_warranty': return TechWarranty;
        case 'fashion_style': return FashionStyle;
        case 'thermal_small': return ThermalSmall;
        case 'large_a4': return LargeA4;
        case 'classic_sharp': return ClassicSharp;
        case 'compact_foodie': return CompactFoodie;
        
        case 'universal': 
        case 'universal_a4': 
        case 'universal_a5': 
        case 'universal_thermal': 
        case 'universal_80mm': 
        case 'universal_58mm': 
        case 'universal_1_4': 
        case 'universal_1_5': 
        case 'universal_1_6': 
        case 'universal_1_7': 
        case 'universal_1_8': 
            return UniversalBillEngine;
        default: return UniversalBillEngine;
    }
};

/**
 * Metadata for Supported Formats
 */
const BASIC_COLS = ['S.No', 'Item Name', 'Qty', 'Rate', 'Amount'];
const PHARMA_COLS = ['S.No', 'Item Name', 'HSN', 'Batch', 'Exp', 'Qty', 'Rate', 'Amount'];
const TAX_COLS = ['S.No', 'Item Name', 'HSN', 'Qty', 'Rate', 'Tax', 'Discount', 'Amount'];
const THERMAL_COLS = ['S.No', 'Item Name', 'Qty', 'Rate', 'Amount'];
const FULL_COLS = ['S.No', 'Item Name', 'HSN', 'Unit', 'Qty', 'Batch', 'Exp', 'Rate', 'Tax', 'Discount', 'Amount'];

export const SUPPORTED_BILLING_FORMATS = [
    { id: 'classic_sharp', label: 'The Classic Sharp (Vyapar Inspired)', device: 'standard', size: 'A4', supportedColumns: FULL_COLS },
    { id: 'compact_foodie', label: 'Compact Foodie (Restaurant Special)', device: 'standard', size: '80mm', supportedColumns: THERMAL_COLS },
    { id: 'medical', label: 'GMED Enterprises (Detailed A4)', device: 'standard', size: 'A4', supportedColumns: PHARMA_COLS },
    { id: 'pharmacy_indian', label: 'Pharmacy / Medical (Indian Standard Bill)', device: 'standard', size: 'A5', supportedColumns: PHARMA_COLS },
    { id: 'medical_real', label: 'Physical Shop Style (General Pharmacy)', device: 'standard', size: 'A5', supportedColumns: PHARMA_COLS },
    { id: 'restaurant_real', label: 'Restaurant (Thermal POS Style)', device: 'thermal', size: '80mm', supportedColumns: THERMAL_COLS },
    { id: 'grocery_real', label: 'Grocery (Physical Shop Style)', device: 'standard', size: '1/4 Size', supportedColumns: TAX_COLS },
    { id: 'electronics_real', label: 'Electronics (Asset Docket)', device: 'standard', size: 'A4', supportedColumns: FULL_COLS },
    { id: 'clothing_real', label: 'Clothing (Physical Shop Style)', device: 'standard', size: 'A4', supportedColumns: TAX_COLS },
    { id: 'general_real', label: 'General Store (Standard Style)', device: 'standard', size: 'A5', supportedColumns: TAX_COLS }
];

export {
    ModernBlue,
    ClassicSharp,
    CompactFoodie,
    GmedMedicalA4,
    RealPharmacyBill,
    RealMedical,
    RealRestaurantThermal,
    RealGrocery,
    RealElectronics,
    RealClothing,
    RealGeneralStore,
    MedicalPro,
    FoodDineIn,
    FastRetail,
    TechWarranty,
    FashionStyle,
    ThermalSmall,
    A4Invoice,
    ServicePro,
    EducationStandard,
    ConsultingPro,
    GeneralStoreA4,
    LargeA4,
    StandardTaxInvoice,
    UniversalBillEngine
};
