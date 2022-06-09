
import { validate_request } from "../utils/auth.js"
import make_response from "../utils/make_response.js"
import get_mongo_instance from "../utils/mongo.js";

export default async function (context, req) {
    const req_status = validate_request(req);

    if (req_status["status"] === false){
        context.res = make_response(400, { "error": req_status["error"] })
        return context.res
    }

    const { value } = req.query;
    const { db, connection } = await get_mongo_instance()
    const prods_tbl = db.collection("products");

    try {
        var products_find = [];
        console.log(value)
        if (value){
            products_find = await prods_tbl.find({ "$or": [{ "name": { "$regex": value, "$options": "i" } }, { "category": { "$regex": value, "$options": "i" }
} ] }).toArray();
        }else{
            products_find = await prods_tbl.find({}).toArray();
        }
        context.res = make_response(200, products_find.map(prod => {
            return {
                ...prod,
                "image": prod["image"] !== "" ? `${process.env["images_route"]}/${prod["image"]}` : ""
            }
        }))
    } catch (ex) {
        console.log(ex)
        context.res = make_response(500, { "error": "Ha ocurrido un error al conectar con la base de datos" })
    } finally {
        connection.close()
    }

    return context.res 
    
}