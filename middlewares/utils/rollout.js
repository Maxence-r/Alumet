const Account = require("../../models/account");
const { sendMail } = require("../../routes/mail/mailing");

async function rolloutExperiment(experimentId, endDate) {
    const accounts = await Account.find({
        experiments: { $ne: experimentId },
    });
    console.log(
        accounts.length + " accounts found for experiment " + experimentId
    );

    const delay =
        accounts.length > 0
            ? Math.abs(new Date() - new Date(endDate)) / accounts.length
            : 0;
    const delayInHours = delay / (1000 * 60 * 60); // Convert milliseconds to hours
    console.log("Rollout delay: " + delayInHours + " hours");

    for (let i = 0; i < accounts.length; i++) {
        accounts[i].experiments.push(experimentId);
        await accounts[i].save();

        sendMail("experiment", accounts[i].mail);
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
}

module.exports = rolloutExperiment;