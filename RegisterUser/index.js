import make_response from "../utils/make_response.js";
import get_mongo_instance from "../utils/mongo.js";
import bcryptjs from "bcryptjs";

export default async function (context, req) {
    const { name, lastname, email, phone, password, gender } = req.body;

    if (!name || !email || !password){
        context.res = make_response(400, {
            "error": "Los campos 'name', 'email' y 'password' son necesarios"
        })
        return context.res
    }
    
    const { db, connection } = await get_mongo_instance()
    const users_tbl = db.collection("users");
    try {
        const user_in_db = await users_tbl.findOne({"email": email});
        if (user_in_db !== null){
            context.res = make_response(400, { "error": "El correo ya se encuentra registrado" })
            return context.res;
        }
        
        const data = {
            name,
            lastname,
            email,
            phone,
            "password": bcryptjs.hashSync(password, 12),
            gender
        };

        await users_tbl.insertOne(data);
        context.res = make_response(200, { "message": "Se ha registrado el usuario" })
    } catch (ex) {
        console.log(ex)
        context.res = make_response(500, { "error": "Ha ocurrido un error al conectar con la base de datos" })
    }finally {
        connection.close()
        
    }

    return context.res

}