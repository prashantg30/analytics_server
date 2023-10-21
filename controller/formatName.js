const { pConn } = require('../config/db.config');
const verifyToken = require('../validation/verifyToken');

//Gives format name according to field_details entered
const getFormatNameForFieldDetails = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = {
                client_id: req.body.id, data_source_name: req.body.data_source_name.toLowerCase(), field_details: req.body.field_details
            };
            let field_details = body.field_details;
            let field_names = field_details.map(e => `${e.field_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`).sort();
            let sql = `select format_name from formats where field_names = ?`;
            const [rows] = await pConn.query(sql, `${field_names}`);
            if (rows.length > 0) {
                return res.status(404).send({ status: false, msg: "Format name for entered field details already exists.", format_name: rows[0].format_name });
            }
            if (rows.length == 0) {
                let sql2 = `SELECT data_source_id from data_source WHERE data_source_name = '${body.data_source_name}'`;
                const [data] = await pConn.query(sql2);
                if (data.length == 0) {
                    return res.send({ status: false, msg: "Entered data_source_name does not exist." });
                }
                if (data.length > 0) {
                    let data_source_id = data[0].data_source_id;
                    let generateId = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
                    const format_name = `${generateId}`;
                    let field_details = JSON.stringify(body.field_details);
                    let query = `INSERT INTO formats (format_name,data_source_id,field_names,field_details)
                    VALUES ('${format_name}','${data_source_id}','${field_names}','${field_details}')`;
                    await pConn.execute(query);
                    return res.status(400).send({ status: true, msg: `Format name for entered field details is created.`, format_name: format_name });
                }
            }
        }
        if (!token) {
            return res.status(400).send({ msg: "Please login again.", status: false })
        }
    } catch (err) {
        return res.status(400).send({ err: err, status: false })
    }
}

module.exports = {
    getFormatNameForFieldDetails
}