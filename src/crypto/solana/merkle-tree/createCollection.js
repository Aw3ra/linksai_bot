import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js" ;
  
  
  import fs from "fs";
  import {
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
    createCreateMetadataAccountV3Instruction,
    createCreateMasterEditionV3Instruction,
    createSetCollectionSizeInstruction,
  } from "@metaplex-foundation/mpl-token-metadata";
  
  import {
    createAccount,
    mintTo,
    createMint,
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  
 const createCollection = async (
      collectionName,
      collectionSymbol,
      collectionUri,
      keypair_json
    ) => {
      const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
      const cmintKey = Keypair.generate();
      const ownerKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypair_json).toString())));
  
      console.log({
        collectionName,
        collectionSymbol,
        collectionUri,
      })
    
      const collectionMint = await createMint(
        connection,
        ownerKeypair,
        ownerKeypair.publicKey,
        ownerKeypair.publicKey,
        0,
        cmintKey,
        { commitment: "finalized" },
        TOKEN_PROGRAM_ID
      );
  
      console.log({
        collectionMint,
      })
  
      const collectionTokenAccount = await createAccount(
        connection,
        ownerKeypair,
        collectionMint,
        ownerKeypair.publicKey,
        undefined,
        { commitment: "finalized" },
        TOKEN_PROGRAM_ID
      );
  
      console.log({
        collectionTokenAccount,
      })
  
      await mintTo(
        connection,
        ownerKeypair,
        collectionMint,
        collectionTokenAccount,
        ownerKeypair,
        1,
        [],
        { commitment: "finalized" }
      );
  
      console.log("MINTED")
  
      const [collectionMetadataAccount, _b] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata", "utf8"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
  
      const collectionMeatadataIX = createCreateMetadataAccountV3Instruction(
        {
          metadata: collectionMetadataAccount,
          mint: collectionMint,
          mintAuthority: ownerKeypair.publicKey,
          payer: ownerKeypair.publicKey,
          updateAuthority: ownerKeypair.publicKey,
        },
        {
          createMetadataAccountArgsV3: {
            data: {
              name: collectionName,
              symbol: collectionSymbol,
              uri: collectionUri,
              sellerFeeBasisPoints: 0,
              creators: null,
              collection: null,
              uses: null,
            },
            isMutable: false,
            collectionDetails: null,
          },
        }
      );
  
      const [collectionMasterEditionAccount, _b2] =
        PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata", "utf8"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            collectionMint.toBuffer(),
            Buffer.from("edition", "utf8"),
          ],
          TOKEN_METADATA_PROGRAM_ID
        );
  
      const collectionMasterEditionIX = createCreateMasterEditionV3Instruction(
        {
          edition: collectionMasterEditionAccount,
          mint: collectionMint,
          mintAuthority: ownerKeypair.publicKey,
          payer: ownerKeypair.publicKey,
          updateAuthority: ownerKeypair.publicKey,
          metadata: collectionMetadataAccount,
        },
        {
          createMasterEditionArgs: {
            maxSupply: 0,
          },
        }
      );``
    
      const sizeCollectionIX = createSetCollectionSizeInstruction(
        {
          collectionMetadata: collectionMetadataAccount,
          collectionAuthority: ownerKeypair.publicKey,
          collectionMint: collectionMint,
        },
        {
          setCollectionSizeArgs: { size: 1000000000 },
        }
      );
    
      let tx = new Transaction()
        .add(collectionMeatadataIX)
        .add(collectionMasterEditionIX)
        .add(sizeCollectionIX);
      try {
        console.log("Signing tx")
        await sendAndConfirmTransaction(connection, tx, [ownerKeypair], {
          commitment: "confirmed",
          skipPreflight: true,
        });
        return {
          collectionMint,
          collectionMetadataAccount,
          collectionMasterEditionAccount,
        };
      } catch (e) {
        console.error("Failed to init collection: ", e);
        throw e;
      }
    };
  
  // Function to call createCollection
  export async function createCollectionFunction(collectionName, collectionSymbol, collectionUri, keypair_json) {
    const collection = await createCollection(collectionName, collectionSymbol, collectionUri, keypair_json);
    fs.writeFileSync(".collection", JSON.stringify(collection, null, 2));
    return collection;
  }