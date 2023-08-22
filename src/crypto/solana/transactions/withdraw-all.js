const HELIUS_KEY = process.env.HELIUS_KEY;

export const getBalances = async (address) => {
    let url = "https://api.helius.xyz/v0/addresses/" + address + "/balances?api-key=" + HELIUS_KEY;
    const response = await fetch(url);
    const data = await response.json();
    return data;
};
