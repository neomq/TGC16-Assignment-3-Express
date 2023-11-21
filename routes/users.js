const express = require("express");
const router = express.Router();
const crypto = require('crypto');

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

// import in the User model
const { User } = require('../models');
const { createRegistrationForm, createLoginForm, bootstrapField } = require('../forms');

router.get('/register', (req,res)=>{
    // display the registration form
    const registerForm = createRegistrationForm();
    res.render('users/register', {
        'form': registerForm.toHTML(bootstrapField)
    })
})

router.post('/register', (req, res) => {
    const registerForm = createRegistrationForm();
    registerForm.handle(req, {
        success: async (form) => {
            const user = new User({
                'name': form.data.name,
                'password': getHashedPassword(form.data.password),
                'email': form.data.email,
                'role': 'administrator'
            });
            await user.save();
            req.flash("success_messages", "User signed up successfully!");
            res.redirect('/aromaadmin') // if the admin is logged in, does not make sense to redirect admin back to login!
        },
        'error': (form) => {
            res.render('users/register', {
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})

// LOGIN PAGE
router.get('/login', (req,res)=>{
    const loginForm = createLoginForm();
    res.render('users/login',{
        'form': loginForm.toHTML(bootstrapField)
    })
})

router.post('/login', async (req, res) => {
    const loginForm = createLoginForm();
    loginForm.handle(req, {
        'success': async (form) => {
            // process the login

            // ...find the user by email and password
            let user = await User.where({
                'email': form.data.email
            }).fetch({
                require: false
            });

            if (!user) {
                req.flash("error_messages", "Sorry, the authentication details you provided does not work.")
                res.redirect('/aromaadmin/users/login');
            } else {
                // check if the password matches
                if (user.get('password') === getHashedPassword(form.data.password)) {
                    // add to the session that login succeed

                    // store the user details
                    req.session.user = {
                        id: user.get('id'),
                        name: user.get('name'),
                        email: user.get('email')
                    }
                    req.flash("success_messages", "Welcome back, " + user.get('name'));
                    res.redirect('/aromaadmin/users/profile');
                } else {
                    req.flash("error_messages", "Sorry, the authentication details you provided does not work.")
                    res.redirect('/aromaadmin/users/login')
                }
            }
        },
        'error': (form) => {
            req.flash("error_messages", "There are some problems logging you in. Please fill in the form again")
            res.render('users/login', {
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})

// DISPLAY LOGGED IN USER
router.get('/profile', (req, res) => {
    const user = req.session.user;
    if (!user) {
        req.flash('error_messages', 'You do not have permission to view this page');
        res.redirect('/aromaadmin/users/login');
    } else {
        res.render('users/profile',{
            'user': user
        })
    }

})

router.get('/logout', (req, res) => {
    req.session.user = null;
    req.flash('success_messages', "Goodbye");
    res.redirect('/aromaadmin/users/login');
})

module.exports = router;