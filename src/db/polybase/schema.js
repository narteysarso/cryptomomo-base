const { Polybase } = require("@polybase/client");
const { ethPersonalSign } = require('@polybase/eth');
const { Wallet } = require("ethers");

require("dotenv").config({ path: ".env" });

const schema = `
@public
collection Account {
    id: string;
    firstname: string;
    lastname: string;
    evmAddress?: string;
    btcAddress?: string;
    solAddress?: string;
    phonenumber: string;
    owners: string[];
    pinkey: {
        version: string;
        nonce: bytes;
        ciphertext: bytes;
    };
    pin: string;
    lang?: string;
    updatedAt?: number; 
    createdAt?: number;

    constructor(
        id: string,
        firstname: string,
        lastname: string,
        evmAddress?: string,
        btcAddress?: string,
        solAddress?: string,
        phonenumber: string,
        owners: string[],
        pinkeyversion: string,
        pinkeynonce: bytes,
        pinkeyciphertext: bytes,
        pin: string,
        lang?: string,
        updatedAt?: number,
        createdAt?: number
    ){
        this.id = id;
        this.firstname = firstname;
        this.lastname = lastname;
        this.evmAddress = evmAddress;
        this.btcAddress = btcAddress;
        this.solAddress = solAddress;
        this.phonenumber = phonenumber;
        this.owners = owners;
        this.pinkey = {
            version: pinkeyversion,
            nonce: pinkeynonce,
            ciphertext: pinkeyciphertext
        };
        this.pin = pin;
        this.lang = lang;
        this.updatedAt = updatedAt; 
        this.createdAt = createdAt; 
    }

    update (
        firstname: string,
        lastname: string,
        evmAddress?: string,
        btcAddress?: string,
        solAddress?: string,
        phonenumber: string,
        owners: string[],
        pinkeyversion: string,
        pinkeynonce: bytes,
        pinkeyciphertext: bytes,
        pin: string,
        lang?: string,
        updatedAt?: number,
        createdAt?: number
    ){
        this.firstname = firstname;
        this.lastname = lastname;
        this.evmAddress = evmAddress;
        this.btcAddress = btcAddress;
        this.solAddress = solAddress;
        this.phonenumber = phonenumber;
        this.owners = owners;
        this.pinkey = {
            version: pinkeyversion,
            nonce: pinkeynonce,
            ciphertext: pinkeyciphertext
        };
        this.pin = pin;
        this.lang = lang;
        this.updatedAt = updatedAt;
        this.createdAt = createdAt;

    }

    updatePin(
        pin: string,
        pinkeyversion: string,
        pinkeynonce: bytes,
        pinkeyciphertext: bytes,
        updatedAt?: number
    ){
       
        this.pinkey = {
            version: pinkeyversion,
            nonce: pinkeynonce,
            ciphertext: pinkeyciphertext
        };
        this.pin = pin;
      this.updatedAt = updatedAt;
    }
    
    del () {
        selfdestruct();
    }

    
}
`;

const load = async () => {
    const db = new Polybase({
        defaultNamespace: process.env.POLYBASE_NAMESPACE,
        signer: async (data) => {
            const wallet = new Wallet(Buffer.from(process.env.WALLET_PRIVATE_KEY, 'hex'));
            return { h: 'eth-personal-sign', sig: ethPersonalSign(wallet._signingKey().privateKey, data) }
        },
    });

    if (!process.env.WALLET_PRIVATE_KEY) {
        throw new Error('No private key provided')
    }

    await db.applySchema(schema)

    return 'Schema loaded'

}

load().then(console.log).catch(console.log);