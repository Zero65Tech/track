const mongoose = require('mongoose');

const automationLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'promotion',
      'pulse_expiry'
    ],
    required: true
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    required: true
  }
}, {
  collection: 'automation_logs',
  timestamps: true
});

const automationLog = mongoose.model('AutomationLog', automationLogSchema);

module.exports = automationLog;
