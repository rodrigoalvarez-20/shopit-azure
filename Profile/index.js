
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { validate_request } from "../utils/auth.js"
import make_response from "../utils/make_response.js"
import get_mongo_instance from "../utils/mongo.js";

export default async function (context, req) {
    const req_status = validate_request(req);

    if (req_status["status"] === false) {
        context.res = make_response(StatusCodes.BAD_REQUEST, { "error": req_status["error"] })
        return context.res
    }

    const { _id } = req_status["data"];

    const { db, connection } = await get_mongo_instance()
    const users_tbl = db.collection("users");

    try {
        
        var user_profile = await users_tbl.findOne({ _id: ObjectId(_id) });

        if (user_profile === null){
            context.res = make_response(StatusCodes.NOT_FOUND, { "error": "No se ha encontrado información del perfil" })
            return context.res;
        }

        delete user_profile["password"]
        delete user_profile["_id"];

        // Agregar el soporte para las compras del usuario

        context.res = make_response(StatusCodes.OK, { ...user_profile })
        
    } catch (ex) {
        console.log(ex)
        context.res = make_response(StatusCodes.INTERNAL_SERVER_ERROR, { "error": "Ha ocurrido un error al conectar con la base de datos" })
    } finally {
        connection.close()
    }

    return context.res

}