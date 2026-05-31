function getCurrent() {
  const utcDate = new Date();
  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);

  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getNext(monthStr, months = 1) {
  if (!months) return monthStr;

  const date = new Date(`${monthStr}-01`);
  date.setMonth(date.getMonth() + months);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getPrevious(monthStr, months = 1) {
  if (!months) return monthStr;

  const date = new Date(`${monthStr}-01`);
  date.setMonth(date.getMonth() - months);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function min(...months) {
  return months.reduce((minMonth, current) => (current < minMonth ? current : minMonth));
}

function max(...months) {
  return months.reduce((maxMonth, current) => (current > maxMonth ? current : maxMonth));
}

export default { getCurrent, getNext, getPrevious, min, max };