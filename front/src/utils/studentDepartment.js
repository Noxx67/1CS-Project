export function getStudentDepartmentFromPromotion(promotion) {
  const normalizedPromotion = String(promotion || '').trim().toUpperCase();

  if (normalizedPromotion === '1CPI' || normalizedPromotion === '2CPI') {
    return 'Preparatory';
  }

  if (normalizedPromotion === '1CS' || normalizedPromotion === '2CS' || normalizedPromotion === '3CS') {
    return 'Superior';
  }

  return '';
}
