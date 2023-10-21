const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pConn } = require('../config/db.config');

const test = (err, res) => {
    console.log("hello")
    if (err) throw err;
    return res.status(200).send({ msg: "successful" })
}

const login = async (req, res) => {
    try {
        const body = { username: req.body.username, password: req.body.password };
        let sql = `select * from login where username = ?`;
        const [rows] = await pConn.query(sql, [body.username]);
        if (rows.length == 0) {
            return res.status(404).send({ status: false, msg: "User does not exist" });
        }
        if (rows.length > 0) {
            if (rows[0].password == body.password) {
                var token = jwt.sign({ username: rows[0].username }, process.env.DB_SSP, { expiresIn: "2h" });
                return res.status(200).send({ status: true, token: token, msg: "User logged in." });
            }
            if (rows[0].password != body.password) {
                return res.status(404).send({ status: false, msg: "Wrong Password entered." });
            }
        }
    } catch (err) {
        console.log(err)
        return res.status(400).send({ err: err, status: false })
    }
}

module.exports = {
    test,
    login,
}