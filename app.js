const express = require("express");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const app = express();
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");
const Middleware=require("./middlewares/auth");


// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://mkaviyarasu068:USER@cluster0.nefr26o.mongodb.net/online_learning", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Schemas and Models
const courseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
});



const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: {type:String,required: true ,unique: true},
  enrolledCourses: [{ type: String }],
});

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
});

const Course = mongoose.model("Course", courseSchema);
const User = mongoose.model("User", userSchema);
const Category = mongoose.model("Category", categorySchema);

// Routes

// Courses                                                                       //POST
app.post("/api/courses", async (req, res) => {
  try {
    const { title, description, category, price } = req.body;
    const newCourse = new Course({
      id: uuidv4(),
      title,
      description,
      category,
      price,
    });
    const savedCourse = await newCourse.save();
    res.status(200).json(savedCourse);
  } catch (error) {
    console.error("Error saving course:", error);
    res.status(500).json({ error: "Failed to save course" });
  }
});

                                                                                             //GET COURSE

app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

                                                                              //GET COURSE ID

app.get("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findOne({ id });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch course" });
  }
});


                                                                         //PUT COURSE ID

app.put("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, price } = req.body;
    const updatedCourse = await Course.findOneAndUpdate(
      { id },
      { title, description, category, price },
      { new: true }
    );
    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

                                                                                  //DELETE

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCourse = await Course.findOneAndDelete({ id });

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ message: "Course deleted successfully", deletedCourse });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});






// Signup Route
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
     
    });

    const savedUser = await newUser.save();
    res.status(201).json({ message: "Signup successful", user: savedUser });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: "Signup failed" });
  }
});


// Login Route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or user does not exist" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, "Secret_Key", { expiresIn: "1h" });

   res.status(200).json({ message: "Login successful", token, user: { email: user.email, name: user.name } });

  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});


app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});



app.put("/api/users/:id/enroll", async (req, res) => {
  try {
    const { id } = req.params;
    const { courseId } = req.body;
    const user = await User.findOneAndUpdate(
      { id },
      { $addToSet: { enrolledCourses: courseId } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error enrolling user:", error);
    res.status(500).json({ error: "Failed to enroll user" });
  }
});



// Categories
app.post("/api/categories", async (req, res) => {
  try {
    const { name } = req.body;
    const newCategory = new Category({
      id: uuidv4(),
      name,
    });
    const savedCategory = await newCategory.save();
    res.status(200).json(savedCategory);
  } catch (error) {
    console.error("Error saving category:", error);
    res.status(500).json({ error: "Failed to save category" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Start Server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
