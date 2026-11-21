module.exports.config = {
	name: "kick",
	version: "1.7.0",
	hasPermssion: 1,
	credits: "MR JUWEL",
	description: "Ultra fast multi kick system (admins allowed)",
	commandCategory: "System",
	usages: "[tag/reply]",
	cooldowns: 2,
};

module.exports.run = async function ({ api, event }) {
	try {
		const threadID = event.threadID;
		const botID = String(api.getCurrentUserID());

		// গ্রুপের তথ্য আনা
		const info = await api.getThreadInfo(threadID);

		// adminIDs normalize
		const adminIDs = (info.adminIDs || []).map(a => {
			if (a && typeof a === 'object') {
				return String(a.id || a.userID || a.uid || a);
			}
			return String(a);
		});

		// গ্রুপ ক্রিয়েটর (owner) — এদের কিক করা যাবে না
		const ownerID = String(info.threadCreatorID || info.creatorID || "");

		// বট নিজে এডমিন কিনা চেক
		if (!adminIDs.includes(botID)) {
			return api.sendMessage(
				"❌ আমি এই গ্রুপের এডমিন না!\nআগে আমাকে এডমিন বানান, তারপর কিক করতে পারবো।",
				threadID,
				event.messageID
			);
		}

		let targetIDs = [];

		if (event.type === "message_reply") {
			targetIDs.push(event.messageReply.senderID);
		}

		if (event.mentions) {
			targetIDs = targetIDs.concat(Object.keys(event.mentions));
		}

		targetIDs = [...new Set(targetIDs.map(String))];

		if (targetIDs.length === 0)
			return api.sendMessage("⚠️ Reply or tag someone!", threadID, event.messageID);

		// শুধু বট নিজে এবং গ্রুপ ক্রিয়েটরকে বাদ দেওয়া (এডমিনদের এখন কিক করা যাবে)
		const skipped = [];
		const validIDs = targetIDs.filter(id => {
			if (id === botID) {
				skipped.push({ id, reason: "bot" });
				return false;
			}
			if (ownerID && id === ownerID) {
				skipped.push({ id, reason: "owner" });
				return false;
			}
			return true;
		});

		if (validIDs.length === 0)
			return api.sendMessage(
				"⚠️ বট নিজেকে বা গ্রুপ ক্রিয়েটরকে কিক করা যাবে না!",
				threadID,
				event.messageID
			);

		// কতজন এডমিন কিক করতে যাচ্ছি
		const adminTargets = validIDs.filter(id => adminIDs.includes(id));

		await api.sendMessage(
			`⚡ KICK STARTED\n👥 Total: ${validIDs.length}\n` +
			`🛡️ Admin targets: ${adminTargets.length}\n🚀 Fast mode ON`,
			threadID
		);

		let kicked = 0;
		let failed = 0;
		const failedList = [];

		await Promise.all(
			validIDs.map(id =>
				new Promise(resolve => {
					api.removeUserFromGroup(id, threadID, (err) => {
						if (err) {
							failed++;
							failedList.push(id);
						} else {
							kicked++;
						}
						resolve();
					});
				})
			)
		);

		let resultMsg =
			`╭──── FAST RESULT ────╮\n` +
			`│ 👥 Total: ${validIDs.length}\n` +
			`│ ✅ Kicked: ${kicked}\n` +
			`│ ❌ Failed: ${failed}\n` +
			`│ ⏭️ Skipped: ${skipped.length}\n` +
			`│ ⚡ Mode: Ultra Fast\n` +
			`╰────────────────────╯`;

		if (failed > 0) {
			resultMsg +=
				`\n\n⚠️ ${failed} জনকে কিক দেওয়া যায়নি।\n` +
				`সম্ভাব্য কারণ: এডমিনকে কিক দিতে হলে বটকে গ্রুপ ক্রিয়েটর হতে হবে অথবা Facebook ব্লক করেছে।`;
		}

		return api.sendMessage(resultMsg, threadID);

	} catch (err) {
		console.log(err);
		return api.sendMessage("❌ Kick error!", event.threadID);
	}
};
