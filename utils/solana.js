require("dotenv").config({ path: "../.env" });
const { Metaplex } = require("@metaplex-foundation/js");
const { Connection, PublicKey } = require("@solana/web3.js");

const hconnection = new Connection(`https://rpc.theindex.io/mainnet-beta/${process.env.THEINDEX_API_KEY}`, "finalized");
const connection = new Connection(`https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`);
const metaplex = new Metaplex(connection);

const bs58 = require("bs58");
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    getNFT: async (mint) => {
        let nft = null;
        try {
            const mintAddress = new PublicKey(mint);
            nft = await metaplex.nfts().findByMint({ mintAddress });
            if (!!nft) {
                nft.creators = nft.creators.map(i => {
                    i.address = i.address.toBase58()
                    return i;
                })
                nft.royalties = +(+nft.sellerFeeBasisPoints / 100)

            }

        } catch (err) {
            console.log(err);
        } finally {
            return nft;
        }
    },
    getCreators: async (mint) => {
        let creators = null;
        try {
            const mintAddress = new PublicKey(mint);
            const nft = await metaplex.nfts().findByMint({ mintAddress });
            if (!!nft) {
                creators = nft.creators.map(i => {
                    i.address = i.address.toBase58()
                    return i;
                })
            }
        } catch (err) {
            console.log(err);
        } finally {
            return creators;
        }
    },
    getHashlist: async (address) => {
        try {
            const candyMachineId = new PublicKey(address);
            const candyMachineCreator = await getCandyMachineCreator(candyMachineId);

            let addresses = await getMintAddresses(candyMachineCreator[0]);

            if (addresses.length === 0) {
                addresses = await getMintAddresses(candyMachineId);
            }


            return addresses;
        } catch (err) {
            console.log('@getHashlist', err);
            return [];
        }
    }
}

const MAX_NAME_LENGTH = 32;
const MAX_URI_LENGTH = 200;
const MAX_SYMBOL_LENGTH = 10;
const MAX_CREATOR_LEN = 32 + 1 + 1;
const MAX_CREATOR_LIMIT = 5;
const MAX_DATA_SIZE =
    4 +
    MAX_NAME_LENGTH +
    4 +
    MAX_SYMBOL_LENGTH +
    4 +
    MAX_URI_LENGTH +
    2 +
    1 +
    4 +
    MAX_CREATOR_LIMIT * MAX_CREATOR_LEN;
const MAX_METADATA_LEN = 1 + 32 + 32 + MAX_DATA_SIZE + 1 + 1 + 9 + 172;
const CREATOR_ARRAY_START =
    1 +
    32 +
    32 +
    4 +
    MAX_NAME_LENGTH +
    4 +
    MAX_URI_LENGTH +
    4 +
    MAX_SYMBOL_LENGTH +
    2 +
    1 +
    4;

const TOKEN_METADATA_PROGRAM = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const CANDY_MACHINE_V2_PROGRAM = new PublicKey(
    "CMZYPASGWeTz7RNGHaRJfCq2XQ5pYK6nDvVQxzkH51zb"
);

const getMintAddresses = async (firstCreatorAddress) => {
    try {

        let getAccounts = async (firstCreatorAddress) => {
            return await Promise.any([new Promise(async (resolve) => {
                await wait(120 * 1000);
                resolve(false);
            }), new Promise(async (resolve) => {
                let accounts = await hconnection.getProgramAccounts(
                    TOKEN_METADATA_PROGRAM,
                    {
                        // The mint address is located at byte 33 and lasts for 32 bytes.
                        dataSlice: { offset: 33, length: 32 },

                        filters: [
                            // Only get Metadata accounts.
                            { dataSize: MAX_METADATA_LEN },

                            // Filter using the first creator.
                            {
                                memcmp: {
                                    offset: CREATOR_ARRAY_START,
                                    bytes: firstCreatorAddress.toBase58(),
                                },
                            },
                        ],
                    }
                );
                resolve(accounts);
            })])
        }

        let metadataAccounts;
        while (!!!metadataAccounts) {
            metadataAccounts = await getAccounts(firstCreatorAddress);
            if (!!!metadataAccounts)
                console.error('Timedout');
        }

        return metadataAccounts.map((metadataAccountInfo) => {
            return bs58.encode(metadataAccountInfo.account.data.slice(33, 33 + 32));
        });
    } catch (err) {
        console.log('@getMintAddress', err);
        return false;
    }
};

const getCandyMachineCreator = async (candyMachine) =>
    PublicKey.findProgramAddress(
        [Buffer.from("candy_machine"), candyMachine.toBuffer()],
        CANDY_MACHINE_V2_PROGRAM
    );