export function getStatus(totalFee: number, totalPaid: number) {
    const remaining = totalFee - totalPaid
    if (remaining <= 0) return 'paid'
    if (totalPaid > 0) return 'partial'
    return 'unpaid'
  }
  
  export function getProgressPercent(totalFee: number, totalPaid: number) {
    if (totalFee <= 0) return 0
    return Math.min(100, Math.round((totalPaid / totalFee) * 100))
  }
  
  export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }