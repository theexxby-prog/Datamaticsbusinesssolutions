/**
 * Invoice document constants — the fixed blocks that appear on every issued
 * invoice. Kept in one place so the rendered invoice and the PDF cannot drift,
 * and so the payment block can be redacted in a single edit if these ever need
 * to come out of a public build.
 */

export const SELLER = {
  name: 'Datamatics Business Solutions Limited',
  accountsEmail: 'accounts_receivable@datamaticsbpm.com',
  hsnSac: '998371',
};

export const CLIENT_BILLING = {
  name: 'The Channel Company LLC',
  addressLines: ['350 Jericho Turnpike | Ste 310', 'Jericho, NY 11753'],
  placeOfSupply: 'United States',
};

/** Remittance details as printed on the issued invoices. */
export const REMITTANCE = {
  account: 'Datamatics Business Solutions Limited',
  bank: 'State Bank of India, New York',
  accountNo: '77607747620001',
  abaRouting: '026009140',
  swift: 'SBINUS33',
};

export const PAYMENT_TERMS = [
  'This is a computer generated invoice.',
  'All queries should be communicated within 7 days from the receipt of the invoice.',
  'Payment should be made within 30 days from receipt of invoice.',
  'Datamatics reserves the right to charge interest @ 0.75% p.m. on overdue sum.',
  'Any disputes subject to Mumbai Jurisdiction or as agreed by us.',
  'No tax is payable under Reverse Charge Mechanism.',
];
