import make_response from "../utils/make_response.js";
import get_mongo_instance from "../utils/mongo.js";
import { StatusCodes } from "http-status-codes";
import { compareSync } from "bcryptjs";
import { generate_token } from "../utils/auth.js";

export default async function (context, req) {
    const { email, password } = req.body;

    if (!email || !password){
        context.res = make_response(StatusCodes.BAD_REQUEST, {
            "error": "Los campos no pueden estar vacios"
        })
        return context.res;
    }

    const { db, connection } = await get_mongo_instance()
    const users_tbl = db.collection("users");
    try {
        const user_in_db = await users_tbl.findOne({ "email": email });
        if (user_in_db === null) {
            context.res = make_response(StatusCodes.NOT_FOUND, { "error": "La cuenta no se ha registrado en la aplicacion" })
            return context.res;
        }
        const { _id, name } = user_in_db;
        const pwd = user_in_db["password"]

        if(compareSync(password, pwd)){
            const tk = generate_token( _id.toString(), name, email)
            if (!tk){
                context.res = make_response(StatusCodes.INTERNAL_SERVER_ERROR, { "message": "Ha ocurrido un error al generar la token" })
            }else {
                context.res = make_response(StatusCodes.OK, {
                    "message": "Inicio de sesion correcto",
                    "token": tk
                })
            }
        }else {
            context.res = make_response(StatusCodes.BAD_REQUEST, {
                "error": "Las credenciales son incorrectas"
            })
        }
    } catch (ex) {
        console.log(ex)
        context.res = make_response(StatusCodes.INTERNAL_SERVER_ERROR, { "error": "Ha ocurrido un error al conectar con la base de datos" })
    } finally {
        connection.close()

    }
    
    return context.res 
}