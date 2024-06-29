const { Polybase } = require("@polybase/client");
require("dotenv").config({ path: ".env" });

const polybase = () => {

    const tablename = process.env.POLYBASE_NAMESPACE;

    // TODO: make db private
    const db = new Polybase({
        defaultNamespace: tablename,
    });

    const insert = async ({
        collection = "Account",
        accountId,
        firstname,
        lastname,
        evmAddress = "",
        btcAddress = "",
        solAddress = "",
        phonenumber,
        owners,
        pinkeyversion,
        pinkeynonce,
        pinkeyciphertext,
        pinHash,
        lang = "en",
        updatedAt,
        createdAt
    }) => {
        const { data } = await db.collection(collection).create([
            accountId,
            firstname,
            lastname,
            evmAddress,
            btcAddress,
            solAddress,
            phonenumber,
            owners,
            pinkeyversion,
            pinkeynonce,
            pinkeyciphertext,
            pinHash,
            lang,
            updatedAt,
            createdAt
        ]);

        return data;


    }

    const find = async ({ collection = "Account", field = "", value = "", op = "==" }) => {
        const results = await db.collection(collection).where(field, op, value).get();
        return results;
    }

    const findAll = async ({ collection = "Account" }) => {
        const results = await db.collection(collection).get();
        return results?.data?.map((collection) => collection?.data || [])
       
    }

    const findById = async ({ collection = "Account", id }) => {
        
        const {data} = await db.collection(collection).record(id).get();

        return data;
    }

    const findByPhonenumber = async ({ collection = "Account", phonenumber }) => {
        const result = (await find({ collection, field: "phonenumber", value: phonenumber, op: "==" })).data[0];
        return result?.data;
    }

    const findLangByPhonenumber = async ({ collection = "Account", phonenumber }) => {
        const { data } = (await find({ collection, field: "phonenumber", value: phonenumber, op: "==" })).data[0];

        return data["lang"];
    }

    const update = async ({ collection = "Account", id, ...updateInfo }) => {
        const {
            firstname,
            lastname,
            evmAddress,
            btcAddress,
            solAddress,
            phonenumber,
            owners,
            pinkeyversion,
            pinkeynonce,
            pinkeyciphertext,
            pinHash,
            lang,
            updatedAt,
            createdAt
        } = updateInfo;

        const recordData = await db.collection(collection)
            .record(id)
            .call("update", [
                firstname,
                lastname,
                evmAddress,
                btcAddress,
                solAddress,
                phonenumber,
                owners,
                pinkeyversion,
                pinkeynonce,
                pinkeyciphertext,
                pinHash,
                lang,
                updatedAt,
                createdAt
            ]);

        return recordData;
    }

    const updatePin = async ({ collection = "Account", id, ...updateInfo }) => {
        const {
            pinkeyversion,
            pinkeynonce,
            pinkeyciphertext,
            pinHash,
            updatedAt,
        } = updateInfo;

        const recordData = await db.collection(collection)
            .record(id)
            .call("updatePin", [
                pinHash,
                pinkeyversion,
                pinkeynonce,
                pinkeyciphertext,
                updatedAt,
            ]);

        return recordData;
    }
    

    const remove = async ({ collection = "Account", id }) => {
        return await db.collection(collection).record(id).call("remove");
    }

    return Object.freeze({
        getTablename: () => tablename,
        insert,
        findById,
        findByPhonenumber,
        findLangByPhonenumber,
        find,
        findAll,
        update,
        updatePin,
        remove
    });


}

module.exports = polybase;