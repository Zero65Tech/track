const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: '2-digit' 
});

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const INR_FORMATTER_NO_DECIMALS = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

function formatCurrency(value) {
    return INR_FORMATTER.format(value);
}

function formatCurrencyNoDecimals(value) {
    return INR_FORMATTER_NO_DECIMALS.format(value);
}

function formatMonth(month) {
    const [yyyy, mm] = month.split('-');
    return yyyy + ' ' + (MONTH_NAMES[mm - 1] || `Month ${mm}`);
};

function formatDate(date) {
    return DATE_FORMATTER.format(date);
}

function formatTimeAgo(timestamp) {
    const diffMillis = Date.now() - timestamp;
    const diffSeconds = Math.floor(diffMillis / 1000);

    if (diffSeconds < 60) return 'Just now';

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default { formatCurrency, formatCurrencyNoDecimals, formatMonth, formatDate, formatTimeAgo };