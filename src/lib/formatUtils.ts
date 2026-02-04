// Indian number formatting utility
// Use Rs. for PDF exports (jsPDF doesn't render ₹ properly)
// Use ₹ for UI display

export const formatIndianCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)} K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

// For UI display - uses ₹ symbol
export const formatFullCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// For PDF exports - uses Rs. to avoid encoding issues
export const formatCurrencyForPDF = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-IN')}`;
};

// For compact display with Indian numbering (Lakhs, Crores)
export const formatCompactCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    const crores = amount / 10000000;
    return `₹${crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2)} L`;
  } else if (amount >= 1000) {
    const thousands = amount / 1000;
    return `₹${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(2)} K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Compact format for PDF exports
export const formatCompactCurrencyForPDF = (amount: number): string => {
  if (amount >= 10000000) {
    const crores = amount / 10000000;
    return `Rs. ${crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `Rs. ${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2)} L`;
  } else if (amount >= 1000) {
    const thousands = amount / 1000;
    return `Rs. ${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(2)} K`;
  }
  return `Rs. ${amount.toLocaleString('en-IN')}`;
};
