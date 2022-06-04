import jwt from "jsonwebtoken";
import fs from "fs";

function generate_token(id, name, email){
    const pKey = fs.readFileSync(`${process.cwd()}/keys/private.key`, "utf-8"); 
    return jwt.sign({
        "_id": id,
        name,
        email
    }, pKey, {
        "algorithm": "RS256",
        "expiresIn": "3h"
    });
}

function validate_request(req){
    try {
        
        const token = req.headers.authorization || req.headers["Authorization"];

        const pubKey = fs.readFileSync(`${process.cwd()}/keys/public.pub`, "utf-8");

        const decode = jwt.verify(token, pubKey);

        return { "status": true, "data": { ...decode } }

    } catch (ex) {
        console.log(ex.message);
        return { "status": false, "error": "Autenticación fallida" }
    }
}


export { generate_token, validate_request }