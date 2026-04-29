import * as fs from 'fs';
import Papa from 'papaparse';

const csv = `
Extrato Conta Corrente,,,,
Conta,3.24E+08,,,
PerÃ-odo,01/01/2026 a 28/04/2026,,,
Saldo,0,48,,,
,,,,
Data LanÃ,HistÃ³rico,DescriÃ§Ã£,Valor,Saldo
01/01/2026,Pix recebido,Jaciara De,5,0.48
02/01/2026,Pix enviado,Cbd Bilhet,-10,-4.52
`;

Papa.parse(csv, {
  header: false,
  skipEmptyLines: true,
  complete: (results) => {
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(results.data.length, 10); i++) {
        const row = results.data[i] as any[];
      const rowWords = Array.isArray(row) ? row.join(' ').toLowerCase() : '';
      if (rowWords.includes('data') || rowWords.includes('date') || rowWords.includes('valor') || rowWords.includes('amount')) {
        headerRowIdx = i;
        break;
      }
    }
    
    console.log("headerRowIdx", headerRowIdx);
    
    let dataToProcess = [];
    let headers: string[] = [];
    if (headerRowIdx !== -1) {
      headers = (results.data[headerRowIdx] as string[]).map(h => String(h).trim().toLowerCase());
      dataToProcess = results.data.slice(headerRowIdx + 1);
    } else {
      dataToProcess = results.data;
    }
    
    console.log("headers", headers);
    const dateIdx = headers.findIndex((k: string) => /data|date|lançamento|vencimento|movimento/i.test(k));
    const valIdx = headers.findIndex((k: string) => /valor|amount/i.test(k));
    console.log("dateIdx", dateIdx, "valIdx", valIdx);
  }
});
