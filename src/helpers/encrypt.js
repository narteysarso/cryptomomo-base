const crypto = require("crypto");
const { aescbc, decodeFromString, encodeToString } = require('@polybase/util');

async function symmmetricEncryptString(encryptionKey, rawData) {

    // convert password to Uint8Array
    const key = decodeFromString(crypto.createHash("sha256").update(encryptionKey).digest("hex").substring(0,32), "utf8");

    // Convert string value to Uint8Array so it can be encrypted
    const strDataToBeEncrypted = decodeFromString(rawData, 'utf8');

    // Encrypt the data, as EncryptedDataAesCbc256
    const encryptedData = await aescbc.symmetricEncrypt(key, strDataToBeEncrypted);

    // Store this data for later access
    return encryptedData;
}

function encodeU8AToString(data){
    return encodeToString(data, 'utf8');
}

function decodeU8AFromString(str){
    return decodeFromString(str, "utf8");
}

async function symmetricDecryptString(encryptionKey, encryptedData) {
    // convert password to  Uint8Array
    const key = decodeFromString(crypto.createHash("sha256").update(encryptionKey).digest("hex").substring(0,32), "utf8");
    
    // Encrypt the data (as EncryptedDataAesCbc256)
    const dataBytes = await aescbc.symmetricDecrypt(key, encryptedData)

    // Convert back from Uint8Array to string
    const rawData = encodeToString(dataBytes, 'utf8');

    return rawData;
}



module.exports = {
    symmetricDecryptString,
    symmmetricEncryptString,
    encodeU8AToString,
    decodeU8AFromString
}
