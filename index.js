const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
var cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;
mongoose.connect('mongodb+srv://hoangthach1402:hoangthach123@cluster0.mmtet.mongodb.net/loginSystem?retryWrites=true&w=majority',{useNewUrlParser: true, useUnifiedTopology: true});
const API_KEY = 'daylaapikey';
const checkAPIKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    console.log(apiKey)
    if (apiKey && apiKey === API_KEY) {
      next(); // Cho phép tiếp tục xử lý các route
    } else {
      res.status(401).json({ error: 'API key không hợp lệ' });
    }
  };
  
  app.use(checkAPIKey);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    isVerified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

app.get('/users', async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (error) {
      console.error('Lỗi lấy danh sách người dùng:', error);
      res.status(500).json({ error: 'Lỗi lấy danh sách người dùng' });
    }
  });
  app.get('/users/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Không tìm thấy người dùng' });
      } else {
        res.json(user);
      }
    } catch (error) {
      console.error('Lỗi lấy thông tin người dùng:', error);
      res.status(500).json({ error: 'Lỗi lấy thông tin người dùng' });
    }
  });
  app.delete('/users/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const deletedUser = await User.findByIdAndRemove(userId);
      if (!deletedUser) {
        res.status(404).json({ error: 'Không tìm thấy người dùng' });
      } else {
        res.json({ message: 'Xóa người dùng thành công' });
      }
    } catch (error) {
      console.error('Lỗi xóa người dùng:', error);
      res.status(500).json({ error: 'Lỗi xóa người dùng' });
    }
  });
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
        text: `Hello, please verify your email by clicking the following link: https://loginsystem.herokuapp.com/verify-email?token=${token}`
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
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('-password');
  
    if (user) {
      if (user.isVerified) {
        const validPassword = await bcrypt.compare(password, user.password);
        if (validPassword) {
          const token = jwt.sign({ userId: user._id }, 'SECRET_KEY', { expiresIn: '1h' });
          res.json({ message: 'Đăng nhập thành công', user, token });
        } else {
          res.send('Mật khẩu không chính xác');
        }
      } else {
        res.send('Người dùng chưa được xác minh');
      }
    } else {
      res.send('Không tìm thấy người dùng');
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
        res.send('xac thuc thanh cong, vui long dang nhap');
    } catch (err) {
        res.status(400).json({error: 'Lỗi xác thực.'});
    }
});



app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
