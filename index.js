const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
const DATA_URL ="mongodb+srv://hoangthach1402:hoangthach123@cluster0.mmtet.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const connectDB = async () => {
    try {
      await mongoose.connect("mongodb+srv://hoangthach1402:hoangthach123@cluster0.mmtet.mongodb.net/loginSystem?retryWrites=true&w=majority", {
        useUnifiedTopology: true,
      });
  
      console.log("MongoDB connected");
    } catch (error) {
      console.log(error.message);
      process.exit(1);
    }
  };
  
  connectDB();
// mongoose.connect('mongodb+srv://hoangthach1402:hoangthach123@cluster0.jdvz1fg.mongodb.net',{useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    isVerified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

app.get('/', async (req,res)=>{
    const users = await User.find();
    res.json(users)
    
})
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, 'SECRET_KEY', { expiresIn: '1h' });

    // Create a transporter
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'vuhoangthach1402@gmail.com',
            pass: 'nlwhevlhjuxoebze'
        }
    });

    // Set email options
    let mailOptions = {
        from: 'vuhoangthach1402@gmail.com',
        to: user.email,
        subject: 'Verify Your Email',
        text: `Hello, please verify your email by clicking the following link: http://localhost:3000/verify-email?token=${token}`
    };

    // Send email
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    res.send('User registered successfully! Please check your email to verify your account.');
});

// ... Code for login goes here ...
app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    
    if (user) {
        const validPassword = await bcrypt.compare(password, user.password);
        if (validPassword) {
            const token = jwt.sign({userId: user._id}, 'SECRET_KEY', {expiresIn: '1h'});
            res.json({message: 'Login successful', token});
        } else {
            res.send('Incorrect password');
        }
    } else {
        res.send('User not found');
    }
});


app.get('/verify-email', async (req, res) => {
    try {
        
        const token = req.query.token;
        // console.log(token)
        // Giải mã token
        const decoded = jwt.verify(token,'SECRET_KEY' );
        console.log(decoded)
        // Tìm người dùng và cập nhật trạng thái xác thực
        const user = await User.findOne({_id: decoded.userId});
        console.log(user)
        if (!user) {
            return res.status(404).json({error: 'Không tìm thấy người dùng.'});
        }
        user.isVerified = true;
        await user.save();
        
        // Chuyển hướng người dùng tới trang đăng nhập hoặc trang chủ
        res.redirect('/login');
    } catch (err) {
        res.status(400).json({error: 'Lỗi xác thực.'});
    }
});



app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
