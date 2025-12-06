const coinLedgerService = require('../services/coinLedger.cjs');
const { handleResponse, handleError } = require('../utils/response.cjs');

const create = async (req, res) => {
  try {
    const coinLedgerEntry = await coinLedgerService.create(req.body);
    handleResponse(res, 201, coinLedgerEntry, 'Coin Ledger entry created successfully');
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  create
};