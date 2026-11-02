import fs from 'fs';
import path from 'path';

export interface MunicipalitySeed {
  id: number;
  code: string;
  name: string;
  department: string;
}

export const IDENTIFICATION_DOCUMENTS = [
  { id: 1, code: '11', name: 'Registro civil' },
  { id: 2, code: '12', name: 'Tarjeta de identidad' },
  { id: 3, code: '13', name: 'Cédula de ciudadanía' },
  { id: 4, code: '21', name: 'Tarjeta de extranjería' },
  { id: 5, code: '22', name: 'Cédula de extranjería' },
  { id: 6, code: '31', name: 'NIT' },
  { id: 7, code: '41', name: 'Pasaporte' },
  { id: 8, code: '42', name: 'Documento de identificación extranjero' },
];

export const CUSTOMER_TRIBUTES = [
  { id: 18, code: '01', name: 'IVA' },
  { id: 21, code: 'ZZ', name: 'No aplica' },
];

export const LEGAL_ORGANIZATIONS = [
  { id: 1, code: '1', name: 'Persona Jurídica y asimiladas' },
  { id: 2, code: '2', name: 'Persona Natural y asimiladas' },
];

export const PAYMENT_METHODS = [
  { id: 10, code: '10', name: 'Efectivo' },
  { id: 48, code: '48', name: 'Tarjeta Crédito' },
  { id: 49, code: '49', name: 'Tarjeta Débito' },
  { id: 47, code: '47', name: 'Transferencia Débito Bancaria' },
  { id: 30, code: '30', name: 'Transferencia Crédito' },
  { id: 1, code: '1', name: 'Instrumento no definido' },
];

export const INITIAL_PRODUCTS = [
  {
    code_reference: 'PRD001',
    name: 'Laptop HP Pavilion 15"',
    price: 2450000,
    quantity: 10,
    discount_rate: 0,
    tax_rate: '19.00',
    unit_measure_id: 70,
    standard_code_id: 1,
    is_excluded: 0,
    tribute_id: 1,
    withholding_taxes: JSON.stringify([{ code: '06', withholding_tax_rate: '7.00' }]),
  },
  {
    code_reference: 'PRD002',
    name: 'Smartphone Samsung Galaxy S24',
    price: 3200000,
    quantity: 15,
    discount_rate: 5,
    tax_rate: '19.00',
    unit_measure_id: 70,
    standard_code_id: 1,
    is_excluded: 0,
    tribute_id: 1,
    withholding_taxes: '[]',
  },
  {
    code_reference: 'PRD003',
    name: 'Monitor Dell 27" 4K UHD',
    price: 1350000,
    quantity: 8,
    discount_rate: 0,
    tax_rate: '19.00',
    unit_measure_id: 70,
    standard_code_id: 1,
    is_excluded: 0,
    tribute_id: 1,
    withholding_taxes: '[]',
  },
  {
    code_reference: 'PRD004',
    name: 'Teclado Mecánico RGB Bluetooth',
    price: 280000,
    quantity: 25,
    discount_rate: 0,
    tax_rate: '19.00',
    unit_measure_id: 70,
    standard_code_id: 1,
    is_excluded: 0,
    tribute_id: 1,
    withholding_taxes: '[]',
  },
  {
    code_reference: 'PRD005',
    name: 'Mouse Ergonómico Inalámbrico',
    price: 160000,
    quantity: 30,
    discount_rate: 0,
    tax_rate: '19.00',
    unit_measure_id: 70,
    standard_code_id: 1,
    is_excluded: 0,
    tribute_id: 1,
    withholding_taxes: '[]',
  },
  {
    code_reference: 'PRD006',
    name: 'Servicio de Consultoría IT (Hora)',
    price: 150000,
    quantity: 100,
    discount_rate: 0,
    tax_rate: '19.00',
    unit_measure_id: 70,
    standard_code_id: 1,
    is_excluded: 0,
    tribute_id: 1,
    withholding_taxes: '[]',
  },
  {
    code_reference: 'PRD007',
    name: 'Licencia Software Facturación Cloud 1 Año',
    price: 480000,
    quantity: 50,
    discount_rate: 10,
    tax_rate: '19.00',
    unit_measure_id: 70,
    standard_code_id: 1,
    is_excluded: 0,
    tribute_id: 1,
    withholding_taxes: '[]',
  },
];

export const INITIAL_CUSTOMERS = [
  {
    id: '1109780065',
    names: 'Santiago Rivera Marin',
    email: 'tutosrivegamer@srm.com',
    type_id: 3, // Cédula
    company: 'SRM-TRG S.A.S',
    address: 'Cll. 22 #45C-45',
    phone: '3103362199',
    trade_name: 'SRM-TRG',
    municipality_id: 1041, // Fresno
    verification_digit: null,
    id_org: 2, // Persona Natural
    tribute_id: 21, // No aplica
  },
  {
    id: '901724254',
    names: 'Empresa Demo Colombia S.A.S.',
    email: 'facturacion@democolombia.com',
    type_id: 6, // NIT
    company: 'Empresa Demo Colombia S.A.S.',
    address: 'Cra. 7 #71-21 Torre B',
    phone: '3001234567',
    trade_name: 'Demo S.A.S.',
    municipality_id: 149, // Bogotá
    verification_digit: '1',
    id_org: 1, // Persona Jurídica
    tribute_id: 18, // IVA
  },
  {
    id: '1020304050',
    names: 'Carlos Andrés Gómez Pérez',
    email: 'carlos.gomez@gmail.com',
    type_id: 3,
    company: '',
    address: 'Av. Las Palmas #15-30',
    phone: '3159876543',
    trade_name: '',
    municipality_id: 1, // Medellín
    verification_digit: null,
    id_org: 2,
    tribute_id: 21,
  },
  {
    id: '123456789',
    names: 'Tutos Rive Gamer',
    email: 'tutosrive@enigmasas.com',
    type_id: 3,
    company: 'Enigma S.A.S.',
    address: 'Cra 15 # 85-30',
    phone: '3112233445',
    trade_name: 'Tutos Rive',
    municipality_id: 149,
    verification_digit: null,
    id_org: 2,
    tribute_id: 21,
  },
];

export function loadMunicipalities(): MunicipalitySeed[] {
  try {
    const filePath = path.resolve(process.cwd(), 'public/resources/assets/ciudades.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const list = JSON.parse(raw);
      // Format: { codigo: "05002", nombre: "ABEJORRAL ANTIOQUIA" }
      const municipalities: MunicipalitySeed[] = list.map((item: any, index: number) => {
        const parts = item.nombre.trim().split(' ');
        const department = parts[parts.length - 1] || 'COLOMBIA';
        const name = parts.slice(0, -1).join(' ') || item.nombre;
        return {
          id: index + 1,
          code: item.codigo,
          name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
          department: department.charAt(0).toUpperCase() + department.slice(1).toLowerCase(),
        };
      });

      // Ensure key required IDs for Factus challenge match
      // Fresno -> id 1041 (code: 73283)
      const fresnoIdx = municipalities.findIndex((m) => m.code === '73283' || m.name.toLowerCase().includes('fresno'));
      if (fresnoIdx >= 0) {
        municipalities[fresnoIdx].id = 1041;
        municipalities[fresnoIdx].name = 'Fresno';
      } else {
        municipalities.push({ id: 1041, code: '73283', name: 'Fresno', department: 'Tolima' });
      }

      // San Gil -> id 169
      const sanGilIdx = municipalities.findIndex((m) => m.name.toLowerCase().includes('san gil'));
      if (sanGilIdx >= 0) {
        municipalities[sanGilIdx].id = 169;
      } else {
        municipalities.push({ id: 169, code: '68679', name: 'San Gil', department: 'Santander' });
      }

      // Bogotá -> id 149
      const bogotaIdx = municipalities.findIndex((m) => m.name.toLowerCase().includes('bogota') || m.code === '11001');
      if (bogotaIdx >= 0) {
        municipalities[bogotaIdx].id = 149;
        municipalities[bogotaIdx].name = 'Bogotá D.C.';
      } else {
        municipalities.push({ id: 149, code: '11001', name: 'Bogotá D.C.', department: 'Cundinamarca' });
      }

      // Medellín -> id 1
      const medellinIdx = municipalities.findIndex((m) => m.name.toLowerCase().includes('medellin') || m.code === '05001');
      if (medellinIdx >= 0) {
        municipalities[medellinIdx].id = 1;
        municipalities[medellinIdx].name = 'Medellín';
      }

      return municipalities;
    }
  } catch (err) {
    console.error('Error loading ciudades.json:', err);
  }

  // Fallback essential municipalities
  return [
    { id: 1041, code: '73283', name: 'Fresno', department: 'Tolima' },
    { id: 169, code: '68679', name: 'San Gil', department: 'Santander' },
    { id: 149, code: '11001', name: 'Bogotá D.C.', department: 'Cundinamarca' },
    { id: 1, code: '05001', name: 'Medellín', department: 'Antioquia' },
    { id: 1030, code: '73001', name: 'Ibagué', department: 'Tolima' },
    { id: 1074, code: '76001', name: 'Cali', department: 'Valle del Cauca' },
    { id: 57, code: '08001', name: 'Barranquilla', department: 'Atlántico' },
    { id: 858, code: '68001', name: 'Bucaramanga', department: 'Santander' },
    { id: 187, code: '13001', name: 'Cartagena', department: 'Bolívar' },
    { id: 100, code: '17001', name: 'Manizales', department: 'Caldas' },
  ];
}

export function loadInitialInvoices(): any[] {
  try {
    const filePath = path.resolve(process.cwd(), 'public/json/facturas_all.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.data)) {
        return parsed.data;
      }
    }
  } catch (err) {
    console.warn('Could not load facturas_all.json:', err);
  }
  return [];
}

