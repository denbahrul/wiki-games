const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const session = require('express-session');
const { Sequelize, QueryTypes } = require('sequelize');
const config = require('./config/config.json');

const port = 3000;

const sequelize = new Sequelize(config.development);

app.set("view engine", "hbs");
// app.engine('html', require('hbs').__express);
app.set("views", "views");

app.use("/assets", express.static("assets")); //Akses file statis
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'ytta',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge:360000, secure: false },
}))

app.get('/', renderHome);
app.get('/login', renderLogin);
app.get('/register', renderRegister);

app.post('/register', register);
app.post('/login', login);

// Function Render 
function renderHome(req, res) {
    res.render('home', {
        isLogin: req.session.isLogin
    });
};

function renderLogin(req, res) {
    res.render('login');
};

function renderRegister(req, res) {
    res.render('register');
};

// Function logic
async function register(req, res) {
    try {
        console.log(req.body);

        const { email, username, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `INSERT INTO users_tb ( email, username, password ) 
                        VALUES ('${email}','${username}','${hashedPassword}')`;

        await sequelize.query(query, { type: QueryTypes.INSERT });
    
        res.redirect('/login');
    } catch (error) {
        console.log(error);
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        const query = `SELECT * FROM users_tb WHERE email = '${email}'`;
        const user = await sequelize.query(query, {type: QueryTypes.SELECT});

        console.log(user);

        if (user.length == 0) {
            console.log('Email belum terdaftar');
            return res.redirect('/login');
        } 
        
        const isPasswordValid = await bcrypt.compare(password, user[0].password);
        
        if (!isPasswordValid) {
            console.log('Password tidak sesuai');
            return res.redirect('/login');
        } 

        req.session.isLogin = true;    
        req.session.user = {
            id : user[0].id,
            username : user[0].username,
        };

        console.log(req.session.isLogin);

        console.log('Login Berhasil');
        res.redirect('/');
    }
    catch (error) {
        console.log(error);
    }
}


app.listen(port, () => {
    console.log(`Aplikasi berjalan pada port ${port}`);
})