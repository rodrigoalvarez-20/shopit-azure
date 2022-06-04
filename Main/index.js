
import make_response from "../utils/make_response.js"
export default async function (context) {
    
    console.log("Todo correcto")

    context.res = make_response(200, { "message": "Ok" })
    
}