const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

const conn = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "org",
});

conn.connect((err) => {
	if (err) {
		console.error("Database connection failed:", err);
		process.exit(1);
	}
	console.log("✓ Connected to database");

	// Hash password
	const password = bcrypt.hashSync("student123", 10);

	// Insert demo student account
	const insertStudent = `
		INSERT INTO student_info (lastname, firstname, id_number, email, password) 
		VALUES ('Doe', 'John', '2024-001', 'student@demo.com', ?)
		ON DUPLICATE KEY UPDATE stud_id=stud_id
	`;

	conn.query(insertStudent, [password], (err) => {
		if (err) {
			console.error("Error creating student:", err);
			conn.end();
			process.exit(1);
		}
		console.log("✓ Demo student account created successfully");
		console.log("\n=================================");
		console.log("Demo Student Account Created! 🎉");
		console.log("=================================");
		console.log("\nStudent Login Credentials:");
		console.log("---------------------------");
		console.log("  Name: John Doe");
		console.log("  Email: student@demo.com");
		console.log("  Password: student123");
		console.log("  ID Number: 2024-001");
		console.log("\nLogin at: http://localhost:9000 (click 'Log In')");
		console.log("=================================\n");

		conn.end();
		process.exit(0);
	});
});
