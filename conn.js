const mysql = require("mysql2");

const conn = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "org",
});

conn.connect((err) => {
	if (err) throw err;
	console.log("Database Connected");
});

module.exports = conn;
