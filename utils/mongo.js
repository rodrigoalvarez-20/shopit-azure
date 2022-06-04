import { MongoClient } from "mongodb";

const db_user = process.env["mongo_user"]
const db_pwd = process.env["mongo_pwd"]
const db_name = process.env["mongo_db"]

const config = {
    url: `mongodb+srv://${db_user}:${db_pwd}@shopitcluster.ovmlxn3.mongodb.net`,
    dbName: db_name
};

async function get_mongo_instance() {
    const connection = await MongoClient.connect(config.url, {
        useNewUrlParser: true
    });
    const db = connection.db(config.dbName);
    return {
        connection,
        db
    };
}

export default get_mongo_instance;