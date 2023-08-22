import "./config.js";
import * as fs from 'fs';
import path from 'path';
import { Client, Events, GatewayIntentBits, Collection, DiscordAPIError, EmbedBuilder, ChannelType } from 'discord.js'
import { mint_nft } from "./functions/mint_nft.js";
import { decideFunction } from "./AI/decideFunction.js";
import { createResponse } from "./AI/createResponse.js";
import { createTipLink } from "./crypto/tiplink/createTipLink.js";
import { transfer_tokens } from "./crypto/solana/transfer.js";
import { mint } from "./crypto/solana/merkle-tree/mintNode.js";

const config = JSON.parse(fs.readFileSync("./config.json", 'utf8'));
const { clientId, guildId, token, dms } = config;

const conversations = new Map();


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// client.commands = new Collection();
// const foldersPath = path.join(__dirname, 'commands');
// const commandFolders = fs.readdirSync(foldersPath);

// for (const folder of commandFolders) {
// 	const commandsPath = path.join(foldersPath, folder);
// 	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
// 	for (const file of commandFiles) {
// 		const filePath = path.join(commandsPath, file);
// 		const command = require(filePath);
// 		if ('data' in command && 'execute' in command) {
// 			client.commands.set(command.data.name, command);
// 		} else {
// 			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
// 		}
// 	}
// }

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on("messageCreate", async message =>{
	if(message.author.bot){
		return;
	}
	if(message.mentions.has(client.user.id)){
		try{
			message.channel.sendTyping();
			const userMessages = conversations.get(message.author.id) || [];
			userMessages.push({author: message.author.username, content: message.content.replace('<@!'+client.user.id+'>', '')});
			const results = await decideFunction(message.author.id+": "+message.content.replace('<@!'+client.user.id+'>', ''));
			console.log(results);
        	if(conversations.has(message.author.id)){
				conversations.set(message.author.id, userMessages);
			}
			else{
				conversations.set(message.author.id, [{author: message.author.username, content: message.content}]);
			}

			let reply;
			if (results == undefined || results.name == "reply") {
				console.log(conversations)
				reply = await createResponse(conversations);
				
				// Add the bot's reply
				userMessages.push({author: client.user.displayName, content: reply});
				await message.reply(reply);
			}
			else if(results.name=="send_tip")
			{
				if(dms==="on"){
					const tiplink = await createTipLink();
					//Function to mint NFT here 
			
					// Transfer tokens OR nft to the tiplink
					transfer_tokens(tiplink.pubkey);
					// Send the tiplink to the user in a DM, the user name is results.arguments.name
					let usr = await client.users.fetch(JSON.parse(results.arguments).name.replace('<@', '').replace('>', ''));
					const dmEmbed = new EmbedBuilder()
					.setTitle("New Linksai Tip!")
					.setDescription(await createResponse(conversations, {"role": "system", "content": "You are a discord bot named Linksai and you have just sent "+ usr +" some crypto, celebrate with them! This message is going straight to a private thread's, be super duper excited!."}))
					.setURL(tiplink.link)
					.setColor("#FFA500")
					const thread = await message.channel.threads.create({
						name: "Tip for "+ usr.username+"!",
						autoArchiveDuration: 60,
						type: ChannelType.PrivateThread,
						reason: "Tip Link"
					});
					thread.members.add(usr.id);
					await thread.send({
						embeds: [dmEmbed],
					});
				}
				else{
					await message.reply(tiplink.link);
				}
			}
			else if(results.name=="mint-nft")
			{
					// Mint systemMessage

					// Turn attributes from a string into an object
					let usr = await client.users.fetch(JSON.parse(results.arguments).name.replace('<@', '').replace('>', ''));
					const mintSystemMessage = {"role": "system", "content": "You are a discord bot named Linksai and you have just minted an NFT for "+ usr +", celebrate with them both! You have also sent a link via direct message, do not include any links."}
					const mintResponse = await mint_nft(results);
					const xrayEmbed = new EmbedBuilder()
					.setTitle("New Linksai Gensis: "+mintResponse.metadata.name+"!")
					.setDescription(await createResponse(conversations, mintSystemMessage))
					.setURL(mintResponse.mintTransaction)
					.setColor("#FFA500")
					.setImage(mintResponse.thumbnail)

					const repliedMessage = await message.reply({
						embeds: [xrayEmbed],
					});
					try{
						const dmEmbed = new EmbedBuilder()
						.setTitle("New Linksai Gensis: "+mintResponse.metadata.name+"!")
						.setDescription(await createResponse(conversations, {"role": "system", "content": "You are a discord bot named Linksai and you have just minted an NFT for "+ usr +", celebrate with them! This message is going straight to their DM's, be super duper excited!."}))
						.setURL(mintResponse.link)
						.setColor("#FFA500")
						.setImage(mintResponse.thumbnail)

						const thread = await message.channel.threads.create({
							name: mintResponse.metadata.name +" for "+ usr.username+"!",
							autoArchiveDuration: 60,
							type: ChannelType.PrivateThread,
							reason: "Tip Link"
						});
						thread.members.add(usr.id);
						await thread.send({
							embeds: [dmEmbed],
						});
					} catch(err){
						console.log(err);
						await repliedMessage.reply(await createResponse(conversations, {"role": "system", "content": "You are a discord bot named Linksai, you just tried to send a DM to "+ usr.username+ " but they have DMs from server members disabled. Ask them nicely to turn on DM's."}));
					}
					
			// Create a response with the tiplink
			// Update the user's conversation in the map
			}
			else if(results.name=="receive_tip")
			{
				const tiplink = await JSON.parse(results.arguments).link;
				let usr = await client.users.fetch(JSON.parse(results.arguments).name.replace('<@', '').replace('>', ''));
			}
			conversations.set(message.author.id, userMessages);
		}
		catch(err){
			console.log(err);
			await message.reply(await createResponse(conversations, {"role": "system", "content": "You are a discord bot named Linksai, you just tried to do something but something went wrong. Apologise to the user and ask them to try again"}));
		}
	}	
});

// Log in to Discord with your client's token
client.login(token);