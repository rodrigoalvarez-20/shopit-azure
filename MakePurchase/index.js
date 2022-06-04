import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
import { validate_request } from "../utils/auth.js"
import make_response from "../utils/make_response.js"
import get_mongo_instance from "../utils/mongo.js";
import { generate_purchase_mail, send_email } from "../utils/notify.js";

export default async (context, req) => {
    const req_status = validate_request(req);

    if (req_status["status"] === false) {
        context.res = make_response(StatusCodes.BAD_REQUEST, { "error": req_status["error"] })
        return context.res
    }
    const { db, connection } = await get_mongo_instance()
    const users_tbl = db.collection("users");
    try{
        var no_items = 0;
        var total = 0;
        req.body.forEach(i => {
            total += (i["quantity"] * i["price"])
            no_items += i["quantity"]
        })
        const expDate = new Date().toLocaleString();
        const parsed_prods = req.body.map(i => {
            return {
                "name": i["name"],
                "image": i["image"],
                "sku": i["sku"],
                "category": i["category"],
                "quantity": i["quantity"],
                "price": i["price"]
            }
        })
        const purchase_info = {
            no_items,
            total,
            "date": expDate,
            "products": parsed_prods
        }

        await users_tbl.findOneAndUpdate({ "_id": ObjectId(req_status["data"]["_id"]) }, { "$push": { "purchases": purchase_info } })

        const prods_tbl = db.collection("products");
        for await (const i of req.body) {
            prods_tbl.findOneAndUpdate({ "sku": i["sku"] }, { "$inc": { "stock": (i["quantity"] * -1) } })
        }
        
        //Enviar correo de notificacion
        const bodyEmail = generate_purchase_mail(req_status["data"]["email"], expDate, no_items, total, parsed_prods)
        const status = await send_email(req_status["data"]["email"], "Notificacion de pedido", bodyEmail)
        if (status){
            context.res = make_response(StatusCodes.OK, { "message": "Se ha generado la compra. Que disfrute su pedido" });
        }else {
            context.res = make_response(StatusCodes.OK, { "message": "Se ha generado la compra pero ha ocurrido un error al enviar el correo de notificacion. Lamentamos los inconvenientes." });
        }
        
    }catch(ex){
        console.log(ex)
        context.res = make_response(StatusCodes.INTERNAL_SERVER_ERROR, { "error": "Ha ocurrido un error al conectar con la base de datos" })
    }finally{
        connection.close()
    }

    return context.res
}