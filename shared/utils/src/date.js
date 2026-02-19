function getToday() {
  const utcDate = new Date();
  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);

  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getYesterday() {
  const utcDate = new Date();
  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
  istDate.setUTCDate(istDate.getUTCDate() - 1);

  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNext(dateStr, days = 1) {
  if (!days) return dateStr;

  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPrevious(dateStr, days = 1) {
  if (!days) return dateStr;

  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function min(...dates) {
  return dates.reduce((minDate, current) => (current < minDate ? current : minDate));
}

function max(...dates) {
  return dates.reduce((maxDate, current) => (current > maxDate ? current : maxDate));
}

function getFormattedTimeAgo(timestamp) {
    const diffMillis = Date.now() - timestamp;
    const diffSeconds = Math.floor(diffMillis / 1000);

    if (diffSeconds < 60) return 'Just now';

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default { getToday, getYesterday, getNext, getPrevious, min, max, getFormattedTimeAgo };