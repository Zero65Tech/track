
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

export function formatCurrency(value) {
    return INR_FORMATTER.format(value);
}

export function formatCurrencyNoDecimals(value) {
    return INR_FORMATTER_NO_DECIMALS.format(value);
}

export default { formatCurrency, formatCurrencyNoDecimals };