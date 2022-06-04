
function make_response(status, body){
    return {
        status,
        body,
        headers: {
            'Content-Type': 'application/json'
        }
    }
}

export default make_response;