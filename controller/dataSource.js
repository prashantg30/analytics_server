const { pConn } = require('../config/db.config');
const verifyToken = require('../validation/verifyToken')

const createDataSource = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = { data_source_name: req.body.data_source_name.toLowerCase() };
            let sql = `select * from data_source where data_source_name = ?`;
            const [rows] = await pConn.query(sql, [body.data_source_name]);
            if (rows.length > 0) {
                return res.status(404).send({ status: 0, msg: `Data Source with entered category = ${body.data_source_name} already exists.` });
            }
            if (rows.length == 0) {
                let sql2 = `INSERT INTO data_source ( data_source_name) VALUES ('${body.data_source_name}')`;
                await pConn.execute(sql2)
                return res.send({ status: true, msg: "Data Source created successfully." });
            }
        }
        if (!token) {
            return res.status(400).send({ msg: "Please login again.", status: false })
        }
    } catch (err) {
        return res.status(400).send({ err: err, status: false })
    }
}
const getDataSource = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const [data] = await pConn.query('SELECT * from data_source');
            return res.send({ status: true, data: data })
        }
        if (!token) {
            return res.status(400).send({ msg: "Please login again.", status: false })
        }
    } catch (err) {
        return res.status(400).send({ err: err, status: false })
    }
}
const updateDataSource = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = { data_source_id: req.body.id, data_source_name: req.body.data_source_name };
            let sql = `select * from data_source where data_source_id = ?`;
            const [rows] = await pConn.query(sql, [body.data_source_id]);
            if (rows.length == 0)
                return res.status(404).send({ status: 0, msg: `Data Source with entered data_source_id = ${body.data_source_id} does not exist.` });
            if (rows.length > 0) {
                let sql = `select * from data_source where data_source_name = ? AND data_source_id = ${body.data_source_id}`;
                const [data] = await pConn.query(sql, [body.data_source_name]);
                if (data.length > 0) {
                    return res.send({ msg: `Entered data_source_name is same as old one. Please use different data_source_name.`, status: true });
                }
                if (data.length == 0) {
                    await pConn.execute(`UPDATE data_source SET data_source_name = '${body.data_source_name}' WHERE  id= '${body.data_source_id}'`);
                    return res.send({ msg: `Data Source upadated successfully`, status: true });
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
const deleteDataSource = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const params = { data_source_id: req.params.id };
            let sql = `select * from data_source where data_source_id = ?`;
            const [rows] = await pConn.query(sql, [params.data_source_id]);
            if (rows.length == 0)
                return res.status(404).send({ status: 0, msg: `Data Source with entered data_source_id = ${params.data_source_id} does not exist.` });
            if (rows.length > 0) {
                pConn.execute(`Delete from data_source where data_source_id = '${params.data_source_id}'`);
                return res.send({ msg: `Data Source deleted successfully`, status: true });
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
    createDataSource,
    getDataSource,
    updateDataSource,
    deleteDataSource
}