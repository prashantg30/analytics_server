const { pConn } = require('../config/db.config');
const verifyToken = require('../validation/verifyToken')

const uploadFormat = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = {
                format_name: req.body.format_name, data_source_id: req.body.data_source_id, field_details: req.body.field_details
            };
            const [data] = await pConn.query(`select format_name from formats where format_name = ?`, [body.format_name]);
            if (data.length > 0) {
                return res.status(404).send({ status: 0, msg: `Format with entered Table name = ${body.format_name} already exists.` });
            }
            if (data.length == 0) {
                let bodyFieldDetails = body.field_details;
                let newFieldDetailsArray = [];

                for (let i in bodyFieldDetails) {
                    newFieldDetailsArray.push(bodyFieldDetails[i]);
                }
                let field_names = newFieldDetailsArray.map(e => `${e.field_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`).sort();
                field_names = (field_names.map(e => `${e.replace(/'/g, "")}`)).join(',');
                const [rows] = await pConn.query(`SELECT * from formats where field_names = '${field_names}'`);
                if (rows.length > 0) {
                    const tableName = `${rows[0].data_source_name}_${rows[0].format_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`;
                    return res.status(400).send({ status: false, format_name: rows[0].format_name, tableName: tableName, msg: `Format name and Table corresponsing to entered field details already exists.` });
                }
                if (rows.length == 0) {
                    const [rows] = await pConn.query(`SELECT * from data_source WHERE data_source_id = ${body.data_source_id}`);
                    if (rows.length == 0) {
                        return res.status(404).send({ status: false, msg: `data_source_name for entered data_source_id = ${body.data_source_id} does not exist.` });
                    }
                    if (rows.length > 0) {
                        let format_name = body.format_name?.toLowerCase().replace(/[&\/\\#,[] +()$~%.'":*?<>{}-]/g, "");
                        const tableName = `${rows[0].data_source_name}_${format_name}`;
                        const mapFields = newFieldDetailsArray.map(e => `${e.field_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")} ${e.data_type.toLowerCase().replace(/ /g, "")}`);
                        const createTable = await pConn.execute(`CREATE TABLE ${tableName} (id int auto_increment primary key, client_id int, 
                                    data_source_id int, raw_data_md5 char(32), ${mapFields.join(',')})`);
                        const createUniqueIndex = await pConn.execute(`CREATE UNIQUE INDEX ${tableName} ON ${tableName}(raw_data_md5)`);
                        const createFormat = await pConn.execute(`INSERT INTO formats (format_name,data_source_id,field_details,field_names)
                        VALUES ('${format_name}','${body.data_source_id}','${JSON.stringify(bodyFieldDetails)}','${field_names}')`);
                        return res.send({ status: true, msg: "Table created successfully.", tableName: `${tableName}` });
                    }
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

const getFormats = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const [data] = await pConn.query('SELECT format_name FROM formats');
            if (data.length == 0) {
                return res.status(404).send({ status: false, data: [], msg: `No formats exists. Table is empty.` });
            }
            if (data.length > 0) {
                const [result] = await pConn.query(
                    `SELECT f.id, f.format_name, d.data_source_name FROM formats f
                            INNER JOIN data_source d
                            ON f.data_source_id = d.data_source_id
                            ORDER BY f.id;`
                );
                return res.send({ status: true, data: result })
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

const updateFormat = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = { id: req.body.id, format_name: req.body.format_name.toLowerCase() };
            const [rows] = await pConn.query(`SELECT * FROM formats where id = ?`, [body.id]);
            if (rows.length == 0)
                return res.status(404).send({ status: 0, msg: `Format with entered format_name = ${body.format_name} does not exist.` });
            if (rows.length > 0) {
                let data_source_id = rows[0].data_source_id;
                let oldFormatName = rows[0].format_name;
                if (oldFormatName == body.format_name) {
                    return res.status(404).send({ status: false, msg: `Entered format_name = ${body.format_name} is same as old one. Please use different format_name.` });
                }
                if (oldFormatName != body.format_name) {
                    const [data] = await pConn.query(`SELECT data_source_name FROM data_source WHERE data_source_id = ${data_source_id}`);
                    let data_source_name = data[0].data_source_name;
                    const oldTableName = `${data_source_name}_${oldFormatName?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`;
                    const [findTable] = await pConn.query(`SHOW TABLES LIKE '%${oldTableName}'`);
                    if (findTable.length == 0) {
                        await pConn.execute(`UPDATE formats SET format_name = '${body.format_name}' WHERE  id= '${body.id}'`);
                        return res.send({ msg: `Format upadated successfully`, status: true });
                    }
                    if (findTable.length > 0) {
                        const newTableName = `${data_source_name}_${body.format_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`;
                        await pConn.execute(`ALTER TABLE ${oldTableName} RENAME TO ${newTableName}`);
                        await pConn.execute(`UPDATE formats SET format_name = '${body.format_name}' WHERE  id= '${body.id}'`);
                        return res.send({ msg: `Format upadated successfully`, status: true });
                    }
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

const deleteFormat = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const params = { id: req.params.id };
            const [rows] = await pConn.query(`SELECT * FROM formats WHERE id = '${params.id}'`);
            if (rows.length == 0)
                return res.status(404).send({ status: 0, msg: `Format with entered id = ${params.id} does not exist.` });
            if (rows.length > 0) {
                let data_source_id = rows[0].data_source_id;
                let format_name = rows[0].format_name;
                const [data] = await pConn.query(`SELECT * FROM data_source WHERE data_source_id = ${data_source_id}`);
                let data_source_name = data[0].data_source_name;
                const tableName = `${data_source_name}_${format_name?.toLowerCase().replace(/[&\/\\#, +()$~%.'":*?<>{}-]/g, "")}`;
                const [findTable] = await pConn.query(`SHOW TABLES LIKE '%${tableName}'`);
                if (findTable.length > 0) {
                    await pConn.execute(`DROP TABLE ${tableName}`);
                    await pConn.execute(`DELETE FROM formats WHERE id = '${params.id}'`);
                    return res.send({ msg: `Format deleted successfully`, status: true });
                }
                if (findTable.length == 0) {
                    await pConn.execute(`DELETE FROM formats WHERE id = '${params.id}'`);
                    return res.send({ msg: `Format deleted successfully`, status: true });
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

module.exports = {
    uploadFormat,
    getFormats,
    updateFormat,
    deleteFormat
}