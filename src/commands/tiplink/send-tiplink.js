const { SlashCommandBuilder } = require('discord.js');
const { createTipLink } = require('../../crypto/tiplink/createTipLink.js');
const { transfer_tokens } = require('../../crypto/solana/transfer.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    cooldown: 10,
	data: new SlashCommandBuilder()
		.setName('send-tiplink')
		.setDescription('Creates a tiplink and replies with it!'),
	async execute(interaction) {
		let link
		let publicKey
		// Defer the message because it could take some time
		await interaction.deferReply();

		//Logic for creating a tiplink and loading it goes here, would also need logic to mint and transfer NFTs
        try{
			const tiplink = await createTipLink();
			link = tiplink.link
			publicKey = tiplink.pubkey
			await transfer_tokens(publicKey);
		}
		catch(err){
			console.log(err);
		}

		// Create a reply with the tiplink
		await interaction.editReply('Here is your tiplink: ' + link );
	},
};