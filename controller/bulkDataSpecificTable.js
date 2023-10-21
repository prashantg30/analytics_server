const { pConn } = require('../config/db.config');
const verifyToken = require('../validation/verifyToken');

const getBulkDataForSpecificTable = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = {
                client_id: req.body.id, data_source_name: req.body.data_source_name.toLowerCase(), format_name: req.body.format_name
            };
            const [rows] = await pConn.query(`SELECT * from data_source WHERE data_source_name = '${body.data_source_name}'`);
            if (rows.length == 0)
                return res.status(404).send({ status: false, msg: `data_source_id for data_source_name = '${body.data_source_name}' does not exist.` });
            if (rows.length > 0) {
                const [data] = await pConn.query(`SELECT * from formats WHERE format_name = '${body.format_name}'`);
                if (data.length == 0) {
                    return res.status(404).send({ status: false, msg: `Entered format_name = '${body.format_name}' does not exist.` });
                }
                if (data.length > 0) {
                    const tableName = `${body.data_source_name}_${data[0].format_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`;
                    const [tableData] = await pConn.query(`SELECT * from ${tableName}`);
                    if (tableData.length == 0) {
                        return res.status(404).send({ status: false, msg: `Table has no data for entered format_name = '${body.format_name}'.` });
                    }
                    if (tableData.length > 0) {
                     
                        return res.send({ status: true, data: tableData });
                    }
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
    getBulkDataForSpecificTable
}                