function get(monthStr) {
  const year = parseInt(monthStr.slice(0, 4));
  const month = parseInt(monthStr.slice(4, 6));

  return month <= 3 ? `fy${year - 2000}` : `fy${year - 1999}`;
}

function getCurrent() {
  const utcDate = new Date();
  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth() + 1;

  return month <= 3 ? `fy${year - 2000}` : `fy${year - 1999}`;
}

function getNext(yearStr, years = 1) {
  return yearStr ? `fy${parseInt(yearStr.slice(2, 4)) + years}` : years;
}

function getPrevious(yearStr, years = 1) {
  return years ? `fy${parseInt(yearStr.slice(2, 4)) - years}` : yearStr;
}

function min(...years) {
  return years.reduce((minYear, current) =>
    current < minYear ? current : minYear,
  );
}

function max(...years) {
  return years.reduce((maxYear, current) =>
    current > maxYear ? current : maxYear,
  );
}

export default { get, getCurrent, getNext, getPrevious, min, max };
