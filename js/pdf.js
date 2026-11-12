import { PDF_COMPANY } from './config.js?v=wallpen-vorlage-4';
import { calculateRate, formatCurrency } from './calculator.js?v=wallpen-vorlage-4';
import { cleanText, makeSafeFilenamePart, validateContactForm } from './validation.js?v=wallpen-vorlage-4';
import { PDF_FONTS, PDF_LOGO } from '../assets/pdf-assets.js?v=wallpen-vorlage-4';

const money = value => `${formatCurrency(value)} €`;
const dateDE = date => new Intl.DateTimeFormat('de-DE', {timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',year:'numeric'}).format(date);

// Table labels and values are native PDF text, never a screenshot or a canvas.
export function createOfferPdf({customer, calculation, date = new Date()}) {
  const JsPDF = globalThis.window?.jspdf?.jsPDF;
  if (!JsPDF) throw new Error('Die PDF-Bibliothek konnte nicht geladen werden.');
  const checked = calculateRate({price:calculation?.price,duration:calculation?.duration,residual:calculation?.residual});
  const validatedCustomer=validateContactForm(customer);
  if (!validatedCustomer.valid || !checked.valid) throw new Error('Ungültige Angebotsdaten.');
  customer=validatedCustomer.values;
  const type=customer.financingType;
  const mietkauf=type==="Mietkauf";
  const factorLabel=mietkauf?"Mietkauffaktor":"Leasingfaktor";
  calculation = checked; // Recalculate at export so obsolete or modified rates cannot enter the PDF.
  const doc = new JsPDF({unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
  for (const [weight, style] of [['regular','normal'],['semibold','bold']]) {
    const name = `Barlow-${weight}.ttf`;
    doc.addFileToVFS(name,PDF_FONTS[weight]); doc.addFont(name,'Barlow',style);
  }
  const ink=[28,36,43], grey=[73,88,99], accent=[206,221,1];
  const text=(value,x,y,size=10,bold=false,color=ink,options={})=>{
    doc.setFont('Barlow',bold?'bold':'normal'); doc.setFontSize(size); doc.setTextColor(...color);
    doc.text(String(value),x,y,options);
  };
  const paragraph=(value,x,y,width,size=10)=>{
    doc.setFont('Barlow','normal'); doc.setFontSize(size);
    const lines=doc.splitTextToSize(value,width); doc.setTextColor(...ink); doc.text(lines,x,y);
    return y+lines.length*size*.42;
  };
  const rule=y=>{doc.setDrawColor(220,222,215);doc.setLineWidth(.2);doc.line(20,y,190,y);};
  doc.setProperties({title:`wallPen ${type}angebot`,subject:`Unverbindliche Kalkulation: ${type}`,author:PDF_COMPANY.name,creator:'wallPen Leasingrechner'});
  doc.setFillColor(...accent);doc.rect(0,0,210,3,'F');
  doc.setFillColor(...ink);doc.rect(137,9,53,22,'F');
  doc.addImage(PDF_LOGO,'PNG',142,16.25,43,7.47);
  text([PDF_COMPANY.name, PDF_COMPANY.street, PDF_COMPANY.postalCity].join(' · '),20,40,7,false,grey);
  let y=49;
  for(const line of [customer.company,`${customer.firstName} ${customer.lastName}`,customer.street,`${customer.postalCode} ${customer.city}`]) {
    y=paragraph(cleanText(line,160),20,y,170,10)+1;
  }
  y+=2;
  for(const [label,value] of [
    ['E-Mail:',customer.email || '________________________'],
    ['Telefon:',customer.phone || '________________________'],
  ]) {
    text(label,20,y,9,false,grey);
    y=paragraph(cleanText(value,120),43,y,147,9)+1.5;
  }
  const titleY=Math.max(87,y+16);
  text(dateDE(date),190,titleY-13,9,false,grey,{align:'right'});
  text(`Ihr unverbindliches ${type}angebot`,20,titleY,19,true);
  const salutation=customer.salutation==='Frau'?'Sehr geehrte Frau':'Sehr geehrter Herr';
  y=titleY+13;
  const greeting=`${salutation} ${cleanText(customer.lastName,50)},`;
  y=paragraph(greeting,20,y,170)+3;
  y=paragraph(`vielen Dank für Ihr Interesse. Auf Basis Ihrer Angaben haben wir folgende Kalkulation für die Finanzierungsart ${type} zusammengestellt:`,20,y,170)+6;
  const rows=[
    ['Anschaffungspreis (netto)',money(calculation.price)],
    ['Laufzeit',`${calculation.duration} Monate`],
    [mietkauf?'Anzahlung':'Leasingsonderzahlung',money(0)],
    [factorLabel,`${formatCurrency(calculation.factor)} %`],
    [mietkauf?'Kalkulatorischer Restbetrag':'Kalkulatorischer Restwert',`${calculation.residual} % / ${money(calculation.residualValue)}`],
    [`Monatliche ${type}rate (netto)`,money(calculation.rate)],
  ];
  for(let i=0;i<rows.length;i++) {
    const highlight=i===rows.length-1;
    doc.setFillColor(...(highlight?accent:i%2===0?[240,244,246]:[255,255,255]));doc.rect(20,y-5.5,170,9.5,'F');
    text(rows[i][0],24,y,10,highlight);text(rows[i][1],186,y,10,true,ink,{align:'right'});y+=9.5;
  }
  y+=7;
  if(y>233){doc.addPage();doc.setFillColor(...accent);doc.rect(0,0,210,3,'F');y=25;}
  y=paragraph(`Berechnung: Netto-Anschaffungspreis × ${factorLabel} ÷ 100 = monatliche Nettorate.`,20,y,170,8)+3;
  y=paragraph('Alle Beträge verstehen sich netto, zuzüglich der gesetzlichen Mehrwertsteuer. Dieses Angebot ist unverbindlich und steht unter dem Vorbehalt einer positiven Bonitätsprüfung. ' + (mietkauf ? 'Zahlungsplan, Restbetrag und Eigentumsübergang richten sich nach dem Mietkaufvertrag.' : 'Der kalkulatorische Restwert ist keine garantierte Kaufoption.'),20,y,170,8)+5;
  text('Mit freundlichen Grüßen',20,y,9);y+=5;text(PDF_COMPANY.name,20,y,9,true);
  const pages=doc.getNumberOfPages();
  for(let page=1;page<=pages;page++){
    doc.setPage(page);
    rule(270);
    const footerColumn=(lines,x)=>lines.forEach((line,i)=>text(line,x,274+i*3,6,false,grey));
    footerColumn([PDF_COMPANY.name,PDF_COMPANY.street,PDF_COMPANY.postalCity],20);
    footerColumn([`Fon ${PDF_COMPANY.phone}`,PDF_COMPANY.email],82);
    footerColumn(['Unverbindliches Finanzierungsangebot',`Stand: ${dateDE(date)}`],145);
  }
  return doc;
}

export function buildOfferDownload(data) {
  const doc=createOfferPdf(data);
  const type=makeSafeFilenamePart(data.customer.financingType,'Finanzierung');
  const filename=`wallPen_${type}angebot_${makeSafeFilenamePart(data.customer.company,'Kunde')}.pdf`;
  return {blob:doc.output('blob'),filename};
}
