export const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
export const tgl = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
export const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
export const days = (a, b) => (a && b ? Math.max(1, Math.round((new Date(b) - new Date(a)) / 864e5) + 1) : 1);
export const STATUS_STYLE = {
  Pending: 'bg-amber-100 text-amber-900', 'Waiting Payment': 'bg-orange-100 text-orange-900',
  Confirmed: 'bg-sky-100 text-sky-900', 'In Progress': 'bg-teal-100 text-teal-900',
  Completed: 'bg-green-100 text-green-900', Cancelled: 'bg-stone-200 text-stone-700',
  Verified: 'bg-green-100 text-green-900', Rejected: 'bg-stone-200 text-stone-700'
};
export const waLink = (phone, text) => {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  return `https://wa.me/${d}?text=${encodeURIComponent(text || '')}`;
};
export const dateStr = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
