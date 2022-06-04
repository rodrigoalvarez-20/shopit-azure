import nodemailer from "nodemailer";
import fs from "fs";

function generate_purchase_mail(user, date, no_items, total, products) {
    var template = fs.readFileSync(`${process.cwd()}/templates/purchase.html`, { encoding: "utf-8", flag: "r" });

    template = template.replace("{USER}", user);
    template = template.replace("{DATE}", date);
    template = template.replace("{NO_ITEMS}", no_items);
    template = template.replace("{TOTAL}", total)

    var strItems = "";

    products.forEach(prod => {
        strItems += `
            <div style="display: flex; margin: 12px 24px;">
                <img src="${prod["image"]}" alt="${prod["name"]}" width="140" style="object-fit: contain;" />
                <div style="margin: 0 12px;width:100%; color: #4C3575;">
                    <p>Producto: ${prod["name"]}</p>
                    <p>Precio: $ ${prod["price"]}</p>
                    <p>Cantidad: ${prod["quantity"]}</p>
                </div>
            </div>\n
        `
    })

    template = template.replace("{ITEMS}", strItems);

    return template;

}

async function send_email(dest, subject, body){
    console.log(process.env["mail_token"])
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'rodrigoalvarez449@gmail.com',
            pass: process.env["mail_token"]
        }
    });
    var mailOptions = {
        from: 'shopit_service@noreply.com',
        to: dest, 
        subject: subject,
        html: body
    };

    try{
        await transporter.sendMail(mailOptions);
        return true
    }catch(error){
        console.log(error);
        return false
    }
}

export { generate_purchase_mail, send_email }
