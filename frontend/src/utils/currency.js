/**
 * Format number as Indian Rupees
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string with ₹ symbol
 */
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  
  // Format number with Indian number system (lakhs/crores)
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Format number as Indian Rupees without symbol (for inputs)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (amount) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  
  return amount.toLocaleString('en-IN');
};
