const parseAmount = (val, isExplicitDebit = false) => {
    if (!val) return 0;
    
    if (typeof val === 'string' && val.match(/\d{2}\/\d{2}\/\d{4}/)) return 0;
    
    const lowerVal = val.toString().toLowerCase();
    const isCreditFlag = lowerVal.includes('credito') || lowerVal.includes('crédito') || lowerVal.includes('entrada') || /\bc\s*$/i.test(lowerVal);
    const isDebitFlag = lowerVal.includes('debito') || lowerVal.includes('débito') || lowerVal.includes('saida') || lowerVal.includes('saída') || /\bd\s*$/i.test(lowerVal);
    
    const isDebit = isExplicitDebit || (!isCreditFlag && (isDebitFlag || /-|-\s*R\$|\(.*\)/i.test(val)));
    
    let clean = val.toString().replace(/[^\d.,-]/g, '').trim();
    
    if (clean.includes('.') && clean.includes(',')) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastComma > lastDot) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    
    let parsed = parseFloat(clean);
    if (isNaN(parsed)) return 0;
    
    if (isDebit && parsed > 0) {
        parsed = -parsed;
    }
    
    return parsed;
  };

console.log("- 150.00", "=>", parseAmount("- 150.00"));
console.log("  150.00 D  ", "=>", parseAmount("  150.00 D  "));
console.log("  150.00 C  ", "=>", parseAmount("  150.00 C  "));
console.log("-R$ 150.00", "=>", parseAmount("-R$ 150.00"));
console.log("1.500,50", "=>", parseAmount("1.500,50"));
console.log("-1.500,50", "=>", parseAmount("-1.500,50"));
console.log("(150.00)", "=>", parseAmount("(150.00)"));
console.log("200,00 Entrada", "=>", parseAmount("200,00 Entrada"));
console.log("100,00 Crédito", "=>", parseAmount("100,00 Crédito"));
console.log("25/04/2026", "=>", parseAmount("25/04/2026"));

