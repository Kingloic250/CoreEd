import axiosInstance from './axiosInstance';

const INVOICES = '/api/v1/invoices';
const PAYMENTS = '/api/v1/payments';

export const getInvoices = (params: { studentId?: string; status?: string }) =>
  axiosInstance.get(INVOICES, { params }) as unknown as Promise<unknown[]>;

export const getPayments = (params: { studentId?: string }) =>
  axiosInstance.get(PAYMENTS, { params }) as unknown as Promise<unknown[]>;
