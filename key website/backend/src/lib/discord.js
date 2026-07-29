const axios = require('axios');

const sendDiscordWebhook = async (type, data) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const colors = {
    KEY_CREATED: 0x00ff00,
    KEY_ACTIVATED: 0x00aaff,
    KEY_BLOCKED: 0xff0000,
    HWID_RESET: 0xffaa00,
    ADMIN_LOGIN: 0x8d54ff,
  };

  const embeds = [
    {
      title: `KYRO ${type.replace(/_/g, ' ')}`,
      color: colors[type] || 0x8d54ff,
      fields: [],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'KYRO License System',
      },
    },
  ];

  switch (type) {
    case 'KEY_CREATED':
      embeds[0].fields = [
        { name: 'License Key', value: data.key || 'N/A', inline: true },
        { name: 'Duration', value: data.duration || 'N/A', inline: true },
        { name: 'Created By', value: data.createdBy || 'N/A', inline: true },
      ];
      break;
    case 'KEY_ACTIVATED':
      embeds[0].fields = [
        { name: 'License Key', value: data.key || 'N/A', inline: true },
        { name: 'HWID', value: data.hwid || 'N/A', inline: true },
        { name: 'IP Address', value: data.ipAddress || 'N/A', inline: true },
      ];
      break;
    case 'KEY_BLOCKED':
      embeds[0].fields = [
        { name: 'License Key', value: data.key || 'N/A', inline: true },
        { name: 'Blocked By', value: data.blockedBy || 'N/A', inline: true },
        { name: 'Reason', value: data.reason || 'N/A', inline: true },
      ];
      break;
    case 'HWID_RESET':
      embeds[0].fields = [
        { name: 'License Key', value: data.key || 'N/A', inline: true },
        { name: 'Old HWID', value: data.oldHWID || 'N/A', inline: true },
        { name: 'Reset By', value: data.resetBy || 'N/A', inline: true },
      ];
      break;
    case 'ADMIN_LOGIN':
      embeds[0].fields = [
        { name: 'User', value: data.username || 'N/A', inline: true },
        { name: 'IP Address', value: data.ipAddress || 'N/A', inline: true },
        { name: 'User Agent', value: data.userAgent || 'N/A', inline: true },
      ];
      break;
  }

  try {
    await axios.post(webhookUrl, { embeds });
  } catch (error) {
    console.error('Discord webhook error:', error.message);
  }
};

module.exports = { sendDiscordWebhook };
