const Account = require("../../models/account");
const { sendMail } = require("../../routes/mail/mailing");
const logger = require("../../utils/logger");

async function rolloutExperiment(experimentId, endDate) {
    const endAt = new Date(endDate);
    if (Number.isNaN(endAt.getTime())) {
        logger.warn(`Rollout ${experimentId} ignored: invalid end date ${endDate}`);
        return;
    }

    if (endAt <= new Date()) {
        logger.info(`Rollout ${experimentId} skipped: end date ${endAt.toISOString()} is in the past.`);
        return;
    }

    const accounts = await Account.find({
        experiments: { $ne: experimentId },
    });
    logger.info(accounts.length + " accounts found for experiment " + experimentId);

    const delay =
        accounts.length > 0
            ? (endAt.getTime() - Date.now()) / accounts.length
            : 0;
    const delayInHours = delay / (1000 * 60 * 60); // Convert milliseconds to hours
    logger.info("Rollout delay: " + delayInHours + " hours");

    for (let i = 0; i < accounts.length; i++) {
        accounts[i].experiments.push(experimentId);
        await accounts[i].save();

        sendMail("experiment", accounts[i].mail);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

module.exports = rolloutExperiment;
