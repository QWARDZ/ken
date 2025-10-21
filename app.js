const express = require("express");
const app = express();
const conn = require("./conn.js");
const bcrypt = require("bcryptjs");
const session = require("express-session");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(
	session({
		secret: "your-secret-key-here-change-this",
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
	})
);

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
	if (req.session.user) {
		next();
	} else {
		res.redirect("/?error=please_login");
	}
};

// Middleware to check if admin is logged in
const isAdmin = (req, res, next) => {
	if (req.session.admin) {
		next();
	} else {
		res.redirect("/admin/login?error=admin_login_required");
	}
};

app.get("/", (req, res) => {
	res.render("index");
});

app.get("/students", (req, res) => {
	const getdata = "SELECT * FROM student_info";
	conn.query(getdata, (err, mydata) => {
		if (err) throw err;
		res.render("students", {
			title: "Student Profiling",
			students: mydata,
		});
	});
});

app.get("/delete/:id", (req, res) => {
	const stud_id = req.params.id;

	const del = `DELETE FROM student_info WHERE 
    stud_id = "${stud_id}"`;
	conn.query(del, (err) => {
		if (err) throw err;
		console.log("Data deleted successfully!");
		res.redirect("/students");
	});
});

app.post("/add", (req, res) => {
	const ln = req.body.ln;
	const fn = req.body.fn;
	const id = req.body.id;
	const email = req.body.email;
	const password = req.body.password;

	// query for inserting data in  database
	const sql = `INSERT INTO student_info VALUES (NULL, "${ln}", "${fn}", "${id}", "${email}", "${password}")`;
	conn.query(sql, (err) => {
		if (err) throw err;
		console.log("Data Inserted!");
		res.redirect("/students");
	});
});

// Signup route
app.post("/signup", async (req, res) => {
	try {
		const { ln, fn, id, email, password } = req.body;

		// Check if user already exists
		const checkUser = `SELECT * FROM student_info WHERE email = ?`;
		conn.query(checkUser, [email], async (err, results) => {
			if (err) {
				console.error(err);
				return res.redirect("/?error=signup_failed");
			}

			if (results.length > 0) {
				return res.redirect("/?error=email_exists");
			}

			// Hash password
			const hashedPassword = await bcrypt.hash(password, 10);

			// Insert new user
			const sql = `INSERT INTO student_info (lastname, firstname, id_number, email, password) VALUES (?, ?, ?, ?, ?)`;
			conn.query(sql, [ln, fn, id, email, hashedPassword], (err) => {
				if (err) {
					console.error(err);
					return res.redirect("/?error=signup_failed");
				}
				console.log("User registered successfully!");
				res.redirect("/?success=signup");
			});
		});
	} catch (error) {
		console.error(error);
		res.redirect("/?error=signup_failed");
	}
});

// Login route
app.post("/login", (req, res) => {
	const { email, password } = req.body;

	// First check if it's an admin trying to login
	const adminSql = `SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND is_active = TRUE`;
	conn.query(adminSql, [email, email], async (err, adminResults) => {
		if (err) {
			console.error(err);
		}

		// If admin found, try to authenticate as admin
		if (adminResults && adminResults.length > 0) {
			const admin = adminResults[0];
			const isAdminMatch = await bcrypt.compare(password, admin.password);

			if (isAdminMatch) {
				// Create admin session
				req.session.admin = {
					id: admin.admin_id,
					username: admin.username,
					email: admin.email,
					fullName: admin.full_name,
					role: admin.role,
				};
				console.log("Admin logged in via student login!");
				return res.redirect("/admin/dashboard");
			}
		}

		// If not admin, continue with student login
		const sql = `SELECT * FROM student_info WHERE email = ?`;
		conn.query(sql, [email], async (err, results) => {
			if (err) {
				console.error(err);
				return res.redirect("/?error=login_failed");
			}

			if (results.length === 0) {
				return res.redirect("/?error=invalid_credentials");
			}

			const user = results[0];

			// Compare password
			const isMatch = await bcrypt.compare(password, user.password);

			if (!isMatch) {
				return res.redirect("/?error=invalid_credentials");
			}

			// Create session
			req.session.user = {
				id: user.stud_id,
				email: user.email,
				firstname: user.firstname,
				lastname: user.lastname,
			};

			console.log("User logged in successfully!");
			res.redirect("/dashboard");
		});
	});
});

// Logout route
app.get("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error(err);
		}
		res.redirect("/");
	});
});

// Dashboard route (protected)
app.get("/dashboard", isAuthenticated, (req, res) => {
	res.render("dashboard", { user: req.session.user });
});

// ==================== ADMIN ROUTES ====================

// Admin login page
app.get("/admin/login", (req, res) => {
	if (req.session.admin) {
		return res.redirect("/admin/dashboard");
	}
	res.render("admin-login");
});

// Admin login authentication
app.post("/admin/login", (req, res) => {
	const { username, password } = req.body;

	console.log("Admin login attempt:", { username, password: password ? "***" : "empty" });

	const sql = `SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND is_active = TRUE`;
	conn.query(sql, [username, username], async (err, results) => {
		if (err) {
			console.error("Database error:", err);
			return res.redirect("/admin/login?error=login_failed");
		}

		if (results.length === 0) {
			console.log("No admin found with username/email:", username);
			return res.redirect("/admin/login?error=invalid_credentials");
		}

		const admin = results[0];
		console.log("Admin found:", admin.username, admin.email);

		// Compare password
		const isMatch = await bcrypt.compare(password, admin.password);
		console.log("Password match:", isMatch);

		if (!isMatch) {
			return res.redirect("/admin/login?error=invalid_credentials");
		}

		// Create admin session
		req.session.admin = {
			id: admin.admin_id,
			username: admin.username,
			email: admin.email,
			fullName: admin.full_name,
			role: admin.role,
		};

		console.log("Admin logged in successfully!");
		res.redirect("/admin/dashboard");
	});
});

// Admin dashboard (protected)
app.get("/admin/dashboard", isAdmin, (req, res) => {
	// Get statistics
	const statsQuery = `
        SELECT 
            COUNT(*) as total_students,
            COUNT(DISTINCT email) as unique_emails
        FROM student_info
    `;

	const studentsQuery = `SELECT * FROM student_info ORDER BY stud_id DESC LIMIT 10`;

	conn.query(statsQuery, (err, stats) => {
		if (err) {
			console.error(err);
			return res.redirect("/admin/login?error=database_error");
		}

		conn.query(studentsQuery, (err, students) => {
			if (err) {
				console.error(err);
				return res.redirect("/admin/login?error=database_error");
			}

			res.render("admin-dashboard", {
				admin: req.session.admin,
				stats: stats[0],
				students: students,
			});
		});
	});
});

// Admin - View all students
app.get("/admin/students", isAdmin, (req, res) => {
	const getdata = "SELECT * FROM student_info ORDER BY stud_id DESC";
	conn.query(getdata, (err, students) => {
		if (err) {
			console.error(err);
			return res.redirect("/admin/dashboard?error=database_error");
		}
		res.render("admin-students", {
			admin: req.session.admin,
			students: students,
		});
	});
});

// Admin - Delete student
app.get("/admin/delete-student/:id", isAdmin, (req, res) => {
	const stud_id = req.params.id;
	const del = `DELETE FROM student_info WHERE stud_id = ?`;

	conn.query(del, [stud_id], (err) => {
		if (err) {
			console.error(err);
			return res.redirect("/admin/students?error=delete_failed");
		}
		console.log("Student deleted by admin");
		res.redirect("/admin/students?success=deleted");
	});
});

// Admin - Edit student page
app.get("/admin/edit-student/:id", isAdmin, (req, res) => {
	const stud_id = req.params.id;
	const sql = `SELECT * FROM student_info WHERE stud_id = ?`;

	conn.query(sql, [stud_id], (err, results) => {
		if (err || results.length === 0) {
			console.error(err);
			return res.redirect("/admin/students?error=student_not_found");
		}
		res.render("admin-edit-student", {
			admin: req.session.admin,
			student: results[0],
		});
	});
});

// Admin - Update student
app.post("/admin/update-student/:id", isAdmin, (req, res) => {
	const stud_id = req.params.id;
	const { ln, fn, id_number, email } = req.body;

	const sql = `UPDATE student_info SET lastname = ?, firstname = ?, id_number = ?, email = ? WHERE stud_id = ?`;

	conn.query(sql, [ln, fn, id_number, email, stud_id], (err) => {
		if (err) {
			console.error(err);
			return res.redirect(`/admin/edit-student/${stud_id}?error=update_failed`);
		}
		console.log("Student updated by admin");
		res.redirect("/admin/students?success=updated");
	});
});

// Admin logout
app.get("/admin/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error(err);
		}
		res.redirect("/admin/login");
	});
});

app.listen(9000, () => {
	console.log("Listen to port 9000");
});
