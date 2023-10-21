const { pConn } = require('../config/db.config');
const mysql = require('mysql2');
const md5 = require('md5');
const { UploadCsvDataToMySQL, upload } = require('../utils/fileUpload');
const verifyToken = require('../validation/verifyToken');

const bodyForAddBulkData = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = { client_id: req.body.id, field_details: req.body.field_details };
            let field_names = (body.field_details).map(e => `${e.field_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`).sort();
            const [rows] = await pConn.query(`SELECT * from formats WHERE field_names = '${field_names}'`);
            if (rows.length == 0)
                return res.status(404).send({ status: false, msg: `No data exists for entered field_details.` });
            if (rows.length > 0) {
                let format_name = rows[0].format_name;
                let data_source_id = rows[0].data_source_id;
                const [data] = await pConn.query(`SELECT * from data_source WHERE data_source_id = '${data_source_id}'`);
                if (data.length > 0) {
                    return res.status(200).send({ status: true, data: { data_source_id: data_source_id, data_source_name: data[0].data_source_name, format_name: format_name } });
                }
                if (data.length == 0) {
                    return res.status(404).send({ status: false, msg: "No data source exists for entered field_details" });
                }
            }
        }
        if (!token) {
            return res.status(400).send({ msg: "Please login again.", status: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).send({ err: err, status: false })
    }
}

const addBulkData = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = { client_id: req.body.id, data_source_name: req.body.data_source_name, format_name: req.body.format_name.toLowerCase() };
            const [rows] = await pConn.query(`SELECT * from formats WHERE format_name = '${body.format_name}'`);
            if (rows.length == 0) {
                return res.status(404).send({ status: false, msg: `No data exists for entered format_name.` });
            }
            if (rows.length > 0) {
                const [data] = await pConn.query(`SELECT * from data_source WHERE data_source_name = '${body.data_source_name}'`);
                if (data.length == 0) {
                    return res.status(404).send({ status: false, msg: `data_source_name for entered data_source_id = ${body.data_source_id} does not exist.` });
                }
                if (data.length > 0) {
                    let data_source_id = data[0].data_source_id;
                    if (!req.file) {
                        return res.status(404).send({ status: false, msg: `Please select a file.` });
                    }
                    if (req.file) {
                        let tableName;
                        const uploadData = UploadCsvDataToMySQL(req.file.filename);
                        let curData = []
                        for (let x of uploadData) {
                            x['data_source_id'] = JSON.stringify(data_source_id);
                            x['client_id'] = body.client_id;
                            x['raw_data_md5'] = md5(JSON.stringify(x));
                            curData.push(x);
                        }
                        tableName = `${body.data_source_name}_${body.format_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`;

                        const sql = (tableName, x) => mysql.format(`INSERT IGNORE INTO ?? SET ?`, [tableName, x]);
                        const insertQuery = await Promise.all(
                            curData.map(
                                x => pConn.query(sql(tableName, x))
                            )
                        );
                        return res.send({
                            status: true, tableName: tableName, format_name: body.format_name,
                            msg: `CSV file data has been uploaded in mysql database.`,
                            insertQuery: insertQuery.reduce((acc, x) => acc + x[0].affectedRows, 0)
                        });
                    }
                }
            }
        }
        if (!token) {
            return res.status(400).send({ msg: `Please login again.`, status: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).send({ err: err, status: false })
    }
}

const showBulkData = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = {
                client_id: req.body.id, data_source_name: req.body.data_client_name?.toLowerCase(), format_name: req.body.format_name
            };
            const tableName = `${body.data_source_name}_${body.format_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`;
            let findTable = `SHOW TABLES LIKE '%${tableName}'`;
            const [result] = await pConn.query(findTable);
            if (result.length == 0) {
                return res.status(404).send({ status: false, msg: `Table does not exist for entered format_name` });
            }
            if (result.length > 0) {
                const [data] = await pConn.query(`SELECT * from ${tableName} WHERE client_id = '${body.client_id}'`);
                if (data.length == 0) {
                    return res.status(404).send({ status: false, msg: `No data exists for entered client_id.` });
                }
                if (data.length > 0) {
                    return res.status(200).send({ status: true, data: data });
                }
            }
        }
        if (!token) {
            return res.status(400).send({ msg: `Please login again.`, status: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).send({ err: err, status: false })
    }
}

const updateRowInBulkData = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = { format_name: req.body.format_name, data: req.body.data };
            let data_source_id = body.data.data_source_id;
            const [rows] = await pConn.query(`SELECT * from data_source WHERE data_source_id = ${data_source_id}`);
            if (rows.length == 0) {
                return res.status(404).send({ status: false, msg: `Entered data_source_id '${data_source_id}' does not exist.` });
            }
            if (rows.length > 0) {
                let data_source_name = rows[0].data_source_name;
                const tableName = `${data_source_name}_${body.format_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`;
                const [findTable] = await pConn.query(`SHOW TABLES LIKE '%${tableName}'`);
                if (findTable.length == 0) {
                    return res.status(404).send({ status: false, msg: `Table does not exist for entered format_name` });
                }
                if (findTable.length > 0) {
                    let rowId = body.data.id;
                    const [data] = await pConn.query(`SELECT * from ${tableName} WHERE id = '${rowId}'`);
                    if (data.length == 0) {
                        return res.status(404).send({ status: false, msg: `No data exists for entered id.` });
                    }
                    if (data.length > 0) {
                        const oldData = data[0];
                        let result = { ...oldData, ...body.data };
                        delete result.raw_data_md5;
                        delete result.id;
                        for (let i in result) {
                            if (((JSON.stringify(result[i])).indexOf("T")) == 11 && ((JSON.stringify(result[i])).indexOf("Z")) == 24) {
                                result[i] = result[i].split("T")[0]
                            }
                        }
                        result['raw_data_md5'] = md5(JSON.stringify(result));
                        let sql = mysql.format(`UPDATE ?? SET ? WHERE id = ?`, [tableName, result, rowId]);
                        await pConn.execute(sql)
                        return res.send({ status: true, msg: `Row updated successfully.` });
                    }
                }
            }
        }
        if (!token) {
            return res.status(400).send({ msg: `Please login again.`, status: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).send({ err: err, status: false })
    }
}

const deleteRowInBulkData = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const query = {
                id: req.query.id, data_source_id: req.query.data_source_id, format_name: req.query.format_name
            };
            const [rows] = await pConn.query(`SELECT * from data_source WHERE data_source_id = ${query.data_source_id}`);
            if (rows.length == 0) {
                return res.status(404).send({ status: false, msg: `Entered data_source_id '${query.data_source_id}' does not exist.` });
            }
            if (rows.length > 0) {
                let data_source_name = rows[0].data_source_name;
                const tableName = `${data_source_name}_${query.format_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`;
                const [findTable] = await pConn.query(`SHOW TABLES LIKE '%${tableName}'`);
                if (findTable.length == 0) {
                    return res.status(404).send({ status: false, msg: "Table does not exist for entered format_name" });
                }
                if (findTable.length > 0) {
                    const [data] = await pConn.query(`SELECT * from ${tableName} WHERE id = '${query.id}'`);
                    if (data.length == 0) {
                        return res.status(404).send({ status: false, msg: `No row exists in table '${tableName}' for entered id.` });
                    }
                    if (data.length > 0) {
                        await pConn.execute(`DELETE from ${tableName} WHERE id = '${query.id}'`);
                        return res.send({ status: true, msg: `Row deleted successfully from table '${tableName}'.` });
                    }
                }
            }
        }
        if (!token) {
            return res.status(400).send({ msg: `Please login again.`, status: false })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).send({ err: err, status: false })
    }
}

module.exports = {
    bodyForAddBulkData,
    addBulkData,
    showBulkData,
    updateRowInBulkData,
    deleteRowInBulkData
}