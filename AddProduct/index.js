
import { StatusCodes } from "http-status-codes";
import { validate_request } from "../utils/auth.js"
import make_response from "../utils/make_response.js"
import { BlobServiceClient } from "@azure/storage-blob";
import get_mongo_instance from "../utils/mongo.js";
import { v4 as uuidv4 } from 'uuid';

const blobServiceClient = BlobServiceClient.fromConnectionString(
    `${process.env['blob_conn']};AccountKey=${process.env['blob_key']};EndpointSuffix=core.windows.net`
);
const containerClient = blobServiceClient.getContainerClient(
    "shopit-products"
);

export default async (context, req) => {
    const req_status = validate_request(req);

    if (req_status["status"] === false) {
        context.res = make_response(StatusCodes.BAD_REQUEST, { "error": req_status["error"] })
        return context.res
    }
    const { db, connection } = await get_mongo_instance()
    try {
        const { image, name, sku, description, category, price, stock } = req.body;

        if (!name || !sku){
            context.res = make_response(StatusCodes.BAD_REQUEST, {
                "error": "El nombre y SKU del producto son requeridos"
            })
            return context.res;
        }

        var imageName = "";
        if (image){
            const parts = image.split(";")
            const b64Data = parts[1].split(",")[1]
            const imageData = Buffer.from(b64Data, "base64");
            const contentType = parts[0].split(":")[1];
            imageName = `${uuidv4()}.${contentType.split("/")[1]}`;
            const blockBlobClient = containerClient.getBlockBlobClient(imageName);
            await blockBlobClient.uploadData(imageData, {
                blobHTTPHeaders: {
                    blobContentType: contentType || "image/png",
                },
            });
        }
        
        const prods_tbl = db.collection("products");

        const prod_inserted = await prods_tbl.insertOne({
            image: imageName,
            name, 
            sku,
            description,
            category,
            price: typeof(price) === "number" ? price : parseFloat(price),
            stock: typeof (stock) === "number" ? stock : parseInt(stock)
        })

        if (!prod_inserted["insertedId"]){
            context.res = make_response(StatusCodes.INTERNAL_SERVER_ERROR, { 
                "error": "Ha ocurrido un error al crear el producto. Intente de nuevo mas tarde"
            });
            return context.res;
        }

        context.res = make_response(StatusCodes.CREATED, { "message": "Se ha creado el producto" });
        return context.res;
    } catch (formError) {
        console.log(formError);
        context.res = make_response(StatusCodes.INTERNAL_SERVER_ERROR, { "error": "Ha ocurrido un error al procesar la petición" })
        return context.res;
    }finally {
        connection.close();
    }
}
