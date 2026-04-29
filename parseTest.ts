const parseAmount = (val: string, isExplicitDebit = false) => {
    if (!val) return 0;
    
    if (typeof val === 'string' && val.match(/\d{2}\/\d{2}\/\d{4}/)) return 0;
    
    const lowerVal = val.toString().toLowerCase();
    const isCreditFlag = lowerVal.includes('credito') || lowerVal.includes('crédito') || lowerVal.includes('entrada') || /\bc\s*$/i.test(lowerVal);
    const isDebitFlag = lowerVal.includes('debito') || lowerVal.includes('débito') || lowerVal.includes('saida') || lowerVal.includes('saída') || /\bd\s*$/i.test(lowerVal);
    
    const isDebit = isExplicitDebit || (!isCreditFlag && (isDebitFlag || /-|-\s*R\$|\(.*\)/i.test(val)));
    
    let clean = val.toString().replace(/[^\d.,]/g, '').trim();
    
    if (clean.includes('.') && clean.includes(',')) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastComma > lastDot) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      const parts = clean.split(',');
      if (parts.length > 2) {
        clean = clean.replace(/,/g, '');
      } else if (parts.length === 2 && parts[1].length === 3) {
        clean = clean.replace(/,/g, '');
      } else {
        clean = clean.replace(',', '.');
      }
    } else if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts.length > 2) {
        clean = clean.replace(/\./g, '');
      } else if (parts.length === 2 && parts[1].length === 3) {
        clean = clean.replace(/\./g, '');
      }
    }
    
    let parsed = parseFloat(clean);
    if (isNaN(parsed)) return 0;
    
    if (isDebit && parsed > 0) {
        parsed = -parsed;
    }
    
    return Math.round(parsed * 100) / 100;
  };

console.log(parseAmount("-10.50"));
console.log(parseAmount("2.390,20"));
console.log(parseAmount("R$ 5.00"));
console.log(parseAmount("0,48"));
