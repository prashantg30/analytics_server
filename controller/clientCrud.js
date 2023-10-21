const { pConn } = require('../config/db.config');
const verifyToken = require('../validation/verifyToken')

const createClient = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = { client_name: req.body.client_name };
            let sql = `select * from clients where client_name = ?`;
            const [rows] = await pConn.query(sql, [body.client_name]);
            if (rows.length > 0) {
                return res.status(404).send({ status: 0, msg: `Client with entered name = ${body.client_name} already exists.` });
            }
            if (rows.length == 0) {
                await pConn.execute(`INSERT INTO clients ( client_name) VALUES ('${body.client_name}')`);
                return res.send({ status: true, msg: "Client created successfully." });
            }
        }
        if (!token) {
            return res.status(400).send({ msg: "Please login again.", status: false })
        }
    } catch (err) {
        return res.status(400).send({ err: err, status: false })
    }
}

const getClients = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const [data] = await pConn.query('SELECT * from clients');
            return res.send({ status: true, data: data });
        }
        if (!token) {
            return res.status(400).send({ msg: "Please login again.", status: false })
        }
    } catch (err) {
        return res.status(400).send({ err: err, status: false })
    }
}

const updateClient = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const body = { client_id: req.body.client_id, client_name: req.body.client_name };
            const [rows] = await pConn.query(`select * from clients where client_id = ${body.client_id}`);
            if (rows.length == 0)
                return res.status(404).send({ status: 0, msg: `Client with entered client_id = ${body.client_id} does not exist.` });
            if (rows.length > 0) {
                let sql2 = `select *  from clients where client_name = ? AND client_id = ${body.client_id}`;
                const [data] = await pConn.query(sql2, [body.client_name]);
                if (data.length > 0) {
                    return res.send({ msg: `Entered client_name is same as old one. Please use different client_name.`, status: true });
                }
                if (data.length == 0) {
                    await pConn.execute(`UPDATE clients SET client_name = '${body.client_name}' WHERE  client_id = '${body.client_id}'`);
                    return res.send({ msg: `Client upadated successfully`, status: true });
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
const deleteClient = async (req, res) => {
    try {
        const token = verifyToken(req, res);
        if (token) {
            const params = { client_id: req.params.id };
            const [rows] = await pConn.query(`select * from clients where client_id = ${params.client_id}`);
            if (rows.length == 0)
                return res.status(404).send({ status: 0, msg: `Client with entered client_id = ${params.client_id} does not exist.` });
            if (rows.length > 0) {
                await pConn.execute(`Delete from clients where client_id = '${params.client_id}'`);
                return res.send({ msg: `Client deleted successfully`, status: true });
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
    createClient,
    getClients,
    updateClient,
    deleteClient
}