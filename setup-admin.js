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

	// Create admin_users table
	const createTableSQL = `
		CREATE TABLE IF NOT EXISTS admin_users (
			admin_id INT AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(50) NOT NULL UNIQUE,
			email VARCHAR(150) NOT NULL UNIQUE,
			password VARCHAR(255) NOT NULL,
			full_name VARCHAR(150) NOT NULL,
			role VARCHAR(50) DEFAULT 'admin',
			is_active BOOLEAN DEFAULT TRUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`;

	conn.query(createTableSQL, (err) => {
		if (err) {
			console.error("Error creating table:", err);
			conn.end();
			process.exit(1);
		}
		console.log("✓ Admin table created successfully");

		// Hash password
		const password = bcrypt.hashSync("admin123", 10);

		// Delete existing admins first
		conn.query("DELETE FROM admin_users", (err) => {
			if (err) {
				console.error("Error clearing admins:", err);
			}

			// Insert admin account
			const insertAdmin = `
				INSERT INTO admin_users (username, email, password, full_name, role) 
				VALUES ('admin', 'admin@organization.com', ?, 'System Administrator', 'admin')
			`;

			conn.query(insertAdmin, [password], (err) => {
				if (err) {
					console.error("Error inserting admin:", err);
					conn.end();
					process.exit(1);
				}
				console.log("✓ Admin account created successfully");
				console.log("\n=================================");
				console.log("Admin Setup Complete! 🎉");
				console.log("=================================");
				console.log("\nDefault Admin Credentials:");
				console.log("---------------------------");
				console.log("  Username: admin");
				console.log("  Password: admin123");
				console.log("\nAccess admin at: http://localhost:9000/admin/login");
				console.log("=================================\n");

				conn.end();
				process.exit(0);
			});
		});
	});
});
