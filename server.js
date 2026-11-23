const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// STUDENT DATA
// ==========================================

const students = [
    {
        id: 1,
        username: "ayush.more",
        password: "demo123",
        name: "Ayush More",
        completedSubjects: [
            "Python Programming",
            "Computer Networks",
            "Statistics"
        ],
        registeredCourseIds: []
    }
];

// ==========================================
// ELECTIVE COURSE DATA
// ==========================================

let electives = [
    {
        id: 1,
        title: "Machine Learning Fundamentals",
        department: "AI & Analytics",
        credits: 4,
        prerequisite: "Python Programming",
        capacity: 30,
        availableSeats: 30
    },
    {
        id: 2,
        title: "Cloud Computing",
        department: "CSE",
        credits: 3,
        prerequisite: "Computer Networks",
        capacity: 25,
        availableSeats: 25
    },
    {
        id: 3,
        title: "Cyber Security Essentials",
        department: "CSE",
        credits: 3,
        prerequisite: "Computer Networks",
        capacity: 25,
        availableSeats: 25
    },
    {
        id: 4,
        title: "Data Visualization",
        department: "AI & Analytics",
        credits: 3,
        prerequisite: "Statistics",
        capacity: 20,
        availableSeats: 20
    },
    {
        id: 5,
        title: "Internet of Things",
        department: "Electronics",
        credits: 4,
        prerequisite: "Embedded Systems",
        capacity: 20,
        availableSeats: 20
    },
    {
        id: 6,
        title: "Entrepreneurship & Innovation",
        department: "Management",
        credits: 2,
        prerequisite: null,
        capacity: 30,
        availableSeats: 30
    },
    {
        id: 7,
        title: "Web Application Development",
        department: "CSE",
        credits: 4,
        prerequisite: "Programming Fundamentals",
        capacity: 25,
        availableSeats: 25
    },
    {
        id: 8,
        title: "Business Analytics",
        department: "Management",
        credits: 3,
        prerequisite: "Statistics",
        capacity: 20,
        availableSeats: 20
    }
];

const MAX_ELECTIVES = 2;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getStudent(studentId) {
    return students.find(student => student.id === Number(studentId));
}

function getElective(courseId) {
    return electives.find(course => course.id === Number(courseId));
}

function checkEligibility(student, course) {
    if (!student || !course) {
        return {
            eligible: false,
            message: "Student or elective not found."
        };
    }

    // Check prerequisite
    if (
        course.prerequisite &&
        !student.completedSubjects.includes(course.prerequisite)
    ) {
        return {
            eligible: false,
            message: `Prerequisite not completed: ${course.prerequisite}`
        };
    }

    // Check whether already registered
    if (student.registeredCourseIds.includes(course.id)) {
        return {
            eligible: false,
            message: "You are already registered for this elective."
        };
    }

    // Check maximum elective limit
    if (student.registeredCourseIds.length >= MAX_ELECTIVES) {
        return {
            eligible: false,
            message: `Maximum limit of ${MAX_ELECTIVES} electives reached.`
        };
    }

    // Check seat availability
    if (course.availableSeats <= 0) {
        return {
            eligible: false,
            message: "No seats available for this elective."
        };
    }

    return {
        eligible: true,
        message: "You are eligible to register for this elective."
    };
}

// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.send(`
        <h1>Academic Credit & Elective Selection Engine</h1>
        <p>Backend server is running successfully.</p>
        <p>API: http://localhost:${PORT}/api/electives</p>
    `);
});

// ==========================================
// GET ALL ELECTIVES
// ==========================================

app.get("/api/electives", (req, res) => {
    res.json(electives);
});

// ==========================================
// GET ELECTIVE BY ID
// ==========================================

app.get("/api/electives/:id", (req, res) => {
    const course = getElective(req.params.id);

    if (!course) {
        return res.status(404).json({
            message: "Elective not found."
        });
    }

    res.json(course);
});

// ==========================================
// GET STUDENT PROFILE
// ==========================================

app.get("/api/students/:id", (req, res) => {
    const student = getStudent(req.params.id);

    if (!student) {
        return res.status(404).json({
            message: "Student not found."
        });
    }

    res.json({
        id: student.id,
        username: student.username,
        name: student.name,
        completedSubjects: student.completedSubjects,
        registeredCourseIds: student.registeredCourseIds
    });
});

// ==========================================
// CHECK ELIGIBILITY
// ==========================================

app.get("/api/students/:id/eligibility/:courseId", (req, res) => {
    const student = getStudent(req.params.id);
    const course = getElective(req.params.courseId);

    if (!student) {
        return res.status(404).json({
            message: "Student not found."
        });
    }

    if (!course) {
        return res.status(404).json({
            message: "Elective not found."
        });
    }

    const result = checkEligibility(student, course);

    res.json({
        studentId: student.id,
        courseId: course.id,
        courseName: course.title,
        eligible: result.eligible,
        message: result.message
    });
});

// ==========================================
// REGISTER FOR ELECTIVE
// ==========================================

app.post("/api/students/:id/register", (req, res) => {
    const student = getStudent(req.params.id);

    if (!student) {
        return res.status(404).json({
            message: "Student not found."
        });
    }

    const courseId = Number(req.body.courseId);

    if (!courseId) {
        return res.status(400).json({
            message: "Please provide a valid courseId."
        });
    }

    const course = getElective(courseId);

    if (!course) {
        return res.status(404).json({
            message: "Elective not found."
        });
    }

    const result = checkEligibility(student, course);

    if (!result.eligible) {
        return res.status(400).json({
            message: result.message
        });
    }

    // Register student
    student.registeredCourseIds.push(course.id);

    // Reduce available seats
    course.availableSeats--;

    res.json({
        success: true,
        message: `Successfully registered for ${course.title}.`,
        student: {
            id: student.id,
            name: student.name,
            registeredCourseIds: student.registeredCourseIds
        },
        course: course
    });
});

// ==========================================
// REMOVE / CANCEL REGISTRATION
// ==========================================

app.delete("/api/students/:id/register/:courseId", (req, res) => {
    const student = getStudent(req.params.id);
    const course = getElective(req.params.courseId);

    if (!student) {
        return res.status(404).json({
            message: "Student not found."
        });
    }

    if (!course) {
        return res.status(404).json({
            message: "Elective not found."
        });
    }

    const registered = student.registeredCourseIds.includes(course.id);

    if (!registered) {
        return res.status(400).json({
            message: "You are not registered for this elective."
        });
    }

    // Remove registration
    student.registeredCourseIds =
        student.registeredCourseIds.filter(id => id !== course.id);

    // Restore available seat
    course.availableSeats++;

    res.json({
        success: true,
        message: `Registration cancelled for ${course.title}.`,
        student: student,
        course: course
    });
});

// ==========================================
// CREDIT TRACKER
// ==========================================

app.get("/api/students/:id/credits", (req, res) => {
    const student = getStudent(req.params.id);

    if (!student) {
        return res.status(404).json({
            message: "Student not found."
        });
    }

    // Credits from completed subjects
    const completedCredits = 0;

    // Credits from registered electives
    const registeredCredits = student.registeredCourseIds.reduce(
        (total, courseId) => {
            const course = getElective(courseId);

            return total + (course ? course.credits : 0);
        },
        0
    );

    res.json({
        studentId: student.id,
        completedSubjects: student.completedSubjects,
        registeredCourseIds: student.registeredCourseIds,
        completedCredits: completedCredits,
        registeredCredits: registeredCredits,
        totalCredits: completedCredits + registeredCredits,
        registeredElectives: student.registeredCourseIds.length,
        maximumElectives: MAX_ELECTIVES
    });
});

// ==========================================
// ADMIN: ADD NEW ELECTIVE
// ==========================================

app.post("/api/electives", (req, res) => {
    const {
        title,
        department,
        credits,
        prerequisite,
        capacity
    } = req.body;

    // Validate required information
    if (!title || !department || !credits || !capacity) {
        return res.status(400).json({
            message: "Please provide title, department, credits and capacity."
        });
    }

    if (Number(credits) <= 0 || Number(capacity) <= 0) {
        return res.status(400).json({
            message: "Credits and capacity must be greater than zero."
        });
    }

    // Prevent duplicate electives
    const duplicate = electives.find(
        course => course.title.toLowerCase() === title.toLowerCase()
    );

    if (duplicate) {
        return res.status(400).json({
            message: "An elective with this title already exists."
        });
    }

    const newElective = {
        id: electives.length > 0
            ? Math.max(...electives.map(course => course.id)) + 1
            : 1,

        title: title,
        department: department,
        credits: Number(credits),
        prerequisite: prerequisite || null,
        capacity: Number(capacity),
        availableSeats: Number(capacity)
    };

    electives.push(newElective);

    res.status(201).json({
        success: true,
        message: "Elective added successfully.",
        elective: newElective
    });
});

// ==========================================
// SERVER
// ==========================================

app.listen(PORT, () => {
    console.log("------------------------------------------");
    console.log("Academic Credit & Elective Selection Engine");
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("------------------------------------------");
});